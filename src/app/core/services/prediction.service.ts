import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { MatchService } from './match.service';
import { DbPrediction, PredictionType, MatchWithTeams } from '../models/supabase.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PredictionService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly authService = inject(AuthService);
  private readonly matchService = inject(MatchService);

  // Writable Signals
  private readonly _predictions = signal<Record<string, DbPrediction>>({});
  private readonly _syncing = signal<boolean>(false);
  private readonly _loading = signal<boolean>(false);

  // Public Read-only Signals
  public readonly predictions = computed(() => this._predictions());
  public readonly syncing = computed(() => this._syncing());
  public readonly loading = computed(() => this._loading());

  // Count predicted matches
  public readonly completedCount = computed(() => Object.keys(this._predictions()).length);

  // Percentage predicted
  public readonly completionPercentage = computed(() => {
    const total = this.matchService.matches().length;
    if (total === 0) return 0;
    return Math.round((this.completedCount() / total) * 100);
  });

  // Calculate live score (points awarded by triggers or computed locally)
  public readonly userScore = computed(() => {
    let score = 0;
    const preds = this._predictions();
    const matches = this.matchService.matches();

    matches.forEach(m => {
      const pred = preds[m.id];
      if (pred && m.result && pred.prediction === m.result) {
        score++;
      }
    });

    return score;
  });

  // Dynamic Streaks: consecutive correct predictions
  // Calculates both current streak and maximum historic streak
  public readonly predictionStreaks = computed(() => {
    const preds = this._predictions();
    const matches = [...this.matchService.matches()];

    // Sort matches chronologically by match date to trace streaks accurately
    matches.sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());

    // Only inspect finished matches with an outcome and user prediction
    const finishedPredicted = matches.filter(m => m.status === 'finished' && preds[m.id]);

    let maxStreak = 0;
    let currentStreak = 0;

    finishedPredicted.forEach(m => {
      const pred = preds[m.id];
      if (m.result && pred.prediction === m.result) {
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
      } else {
        currentStreak = 0; // Streak broken
      }
    });

    return {
      currentStreak,
      maxStreak
    };
  });

  // Demo Fallback configuration
  private readonly isDemoMode = computed(() => {
    return environment.supabaseUrl.includes('your-supabase-project');
  });

  constructor() {
    // Automatically load predictions when authentication state resolves
    effect(() => {
      const session = this.authService.session();
      if (session) {
        this.fetchUserPredictions();
      } else {
        this._predictions.set({});
      }
    });
  }

  /**
   * Loads predictions for the active user.
   */
  public async fetchUserPredictions(): Promise<void> {
    const session = this.authService.session();
    if (!session) return;
    
    this._loading.set(true);

    if (this.isDemoMode()) {
      const key = `demo_predictions_${session.user.id}`;
      const cached = localStorage.getItem(key);
      if (cached) {
        this._predictions.set(JSON.parse(cached));
      } else {
        this._predictions.set({});
      }
      this._loading.set(false);
      return;
    }

    try {
      const { data, error } = await this.supabaseService.client
        .from('predictions')
        .select('*')
        .eq('user_id', session.user.id);

      if (data) {
        const dict: Record<string, DbPrediction> = {};
        data.forEach((p: any) => {
          dict[p.match_id] = p as DbPrediction;
        });
        this._predictions.set(dict);
      }
    } catch (e) {
      console.error('Error fetching predictions from Supabase', e);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Registers a prediction for a match.
   * Enforces prediction locking: if the match date has passed, it rejects.
   * Supports offline local queueing.
   */
  public async setPrediction(matchId: string, selection: PredictionType): Promise<{ success: boolean; message: string }> {
    const session = this.authService.session();
    if (!session) {
      return { success: false, message: 'Debes iniciar sesión para realizar predicciones.' };
    }

    // 1. Resolve target match parameters
    const match = this.matchService.matches().find(m => m.id === matchId);
    if (!match) {
      return { success: false, message: 'Partido no encontrado.' };
    }

    // 2. Lock check: Validate if match date is in the past
    const matchDate = new Date(match.match_date);
    const currentDate = new Date();
    
    if (matchDate <= currentDate || match.status === 'closed' || match.status === 'finished') {
      return { success: false, message: 'Predicción Cerrada. El partido ya ha comenzado.' };
    }

    this._syncing.set(true);

    // Formulate database entity
    const predictionObj: DbPrediction = {
      id: this._predictions()[matchId]?.id || 'pred-' + Math.random().toString(36).substr(2, 9),
      user_id: session.user.id,
      match_id: matchId,
      prediction: selection,
      points: 0,
      created_at: new Date().toISOString()
    };

    // 3. Offline/Demo flow
    if (this.isDemoMode()) {
      const dict = { ...this._predictions() };
      dict[matchId] = predictionObj;
      this._predictions.set(dict);
      
      const key = `demo_predictions_${session.user.id}`;
      localStorage.setItem(key, JSON.stringify(dict));
      
      this._syncing.set(false);
      return { success: true, message: 'Predicción guardada localmente (Demo).' };
    }

    // 4. Supabase Upsert flow
    try {
      const payload: any = {
        user_id: session.user.id,
        match_id: matchId,
        prediction: selection
      };

      // If updating, assign existing row ID
      const existingId = this._predictions()[matchId]?.id;
      if (existingId && !existingId.startsWith('pred-')) {
        payload.id = existingId;
      }

      const { data, error } = await this.supabaseService.client
        .from('predictions')
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;

      // Update state dictionary
      const dict = { ...this._predictions() };
      dict[matchId] = data as DbPrediction;
      this._predictions.set(dict);

      return { success: true, message: 'Predicción sincronizada con Supabase.' };
    } catch (e: any) {
      console.warn('Supabase sync failed, caching prediction locally for offline support', e);
      
      // Save locally to offline queue
      const dict = { ...this._predictions() };
      dict[matchId] = predictionObj;
      this._predictions.set(dict);

      this.enqueueOfflinePrediction(predictionObj);
      return { success: true, message: 'Guardado localmente. Se sincronizará al recuperar conexión.' };
    } finally {
      this._syncing.set(false);
    }
  }

  /**
   * Retrieves prediction details for a match.
   */
  public getPredictionForMatch(matchId: string): DbPrediction | null {
    return this._predictions()[matchId] || null;
  }

  // ==========================================
  // OFFLINE QUEUE SYSTEM
  // ==========================================
  
  private enqueueOfflinePrediction(pred: DbPrediction): void {
    const queueKey = 'offline_prediction_queue';
    const queue = JSON.parse(localStorage.getItem(queueKey) || '[]');
    // Filter out existing duplicates for the same match
    const filtered = queue.filter((item: any) => item.match_id !== pred.match_id);
    filtered.push(pred);
    localStorage.setItem(queueKey, JSON.stringify(filtered));
  }

  /**
   * Sweeps and flushes queued offline forecasts to Supabase.
   */
  public async syncOfflinePredictions(): Promise<void> {
    if (this.isDemoMode()) return;
    
    const queueKey = 'offline_prediction_queue';
    const queue: DbPrediction[] = JSON.parse(localStorage.getItem(queueKey) || '[]');
    if (queue.length === 0) return;

    this._syncing.set(true);
    let successCount = 0;

    for (const pred of queue) {
      try {
        const { error } = await this.supabaseService.client
          .from('predictions')
          .upsert({
            user_id: pred.user_id,
            match_id: pred.match_id,
            prediction: pred.prediction
          });
        if (!error) successCount++;
      } catch (e) {
        console.error('Failed to sync queue item', e);
      }
    }

    if (successCount === queue.length) {
      localStorage.removeItem(queueKey);
      await this.fetchUserPredictions();
    } else {
      // Retain failed items in the queue
      const remaining = queue.slice(successCount);
      localStorage.setItem(queueKey, JSON.stringify(remaining));
    }
    
    this._syncing.set(false);
  }
}
