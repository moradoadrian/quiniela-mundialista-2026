import { Injectable, signal, computed, inject, OnDestroy, NgZone } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { MatchService } from './match.service';
import { PredictionService } from './prediction.service';
import { LeaderboardUserEntry } from '../models/supabase.models';
import { MOCK_COMPETITORS } from '../mock/quiniela.mock';
import { RealtimeChannel } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LeaderboardService implements OnDestroy {
  private readonly supabaseService = inject(SupabaseService);
  private readonly authService = inject(AuthService);
  private readonly matchService = inject(MatchService);
  private readonly predictionService = inject(PredictionService);
  private readonly ngZone = inject(NgZone);

  // Writable Signals
  private readonly _leaderboard = signal<LeaderboardUserEntry[]>([]);
  private readonly _loading = signal<boolean>(false);

  // Public Signals
  public readonly leaderboard = computed(() => this._leaderboard());
  public readonly loading = computed(() => this._loading());
  
  // Expose Top 10 leaders
  public readonly top10 = computed(() => this._leaderboard().slice(0, 10));

  // Determine current active user's ranking position
  public readonly currentUserRank = computed(() => {
    const currentUserId = this.authService.session()?.user.id;
    if (!currentUserId) return null;
    const entry = this._leaderboard().find(e => e.userId === currentUserId);
    return entry ? entry.rank || null : null;
  });

  private realtimeChannel?: RealtimeChannel;

  // Demo Fallback configuration
  private readonly isDemoMode = computed(() => {
    return environment.supabaseUrl.includes('your-supabase-project');
  });

  constructor() {
    this.initializeLeaderboard();
  }

  private async initializeLeaderboard(): Promise<void> {
    this._loading.set(true);
    await this.fetchLeaderboard();
    this.setupRealtimeSubscription();
    this._loading.set(false);
  }

  /**
   * Loads general leaderboard listings.
   * Recalculates and orders ranks desc based on total points.
   */
  public async fetchLeaderboard(): Promise<void> {
    if (this.isDemoMode()) {
      this.recalculateDemoLeaderboard();
      return;
    }

    try {
      // Direct SQL Join query from database profiles, aggregating points from predictions.
      const { data: profiles, error: pErr } = await this.supabaseService.client
        .from('profiles')
        .select('id, username, avatar_url, role');

      if (pErr) {
        console.error('Error fetch perfiles:', pErr);
      } else {
        console.log('Perfiles obtenidos de Supabase:', profiles?.length, profiles);
      }

      const { data: predictions, error: prErr } = await this.supabaseService.client
        .from('predictions')
        .select('user_id, points');

      if (prErr) {
        console.error('Error fetch predictions:', prErr);
      }

      if (profiles) {
        const dict: Record<string, { points: number; count: number }> = {};
        
        // Sum points per user
        if (predictions) {
          predictions.forEach((p: any) => {
            if (!dict[p.user_id]) dict[p.user_id] = { points: 0, count: 0 };
            dict[p.user_id].points += p.points || 0;
            dict[p.user_id].count++;
          });
        }

        const entries: LeaderboardUserEntry[] = profiles.map((prof: any) => {
          const stats = dict[prof.id] || { points: 0, count: 0 };
          return {
            userId: prof.id,
            userName: prof.username || 'Predictor',
            avatarUrl: prof.avatar_url,
            role: prof.role,
            points: stats.points,
            totalPredicted: stats.count
          };
        });

        this.sortAndAssignRanks(entries);
      }
    } catch (e) {
      console.error('Error fetching leaderboard', e);
      this.recalculateDemoLeaderboard();
    }
  }

  /**
   * Sorts entries and maps 1-indexed ranks.
   */
  private sortAndAssignRanks(entries: LeaderboardUserEntry[]): void {
    const sorted = entries
      .sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points; // Descending order
        }
        return b.totalPredicted - a.totalPredicted; // Tie-breaker: most predictions
      })
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));
    
    this._leaderboard.set(sorted);
  }

  /**
   * Subscribes to Supabase Realtime Channels.
   * Auto-refreshes leaderboard when matches or predictions tables are mutated in the database.
   */
  private setupRealtimeSubscription(): void {
    if (this.isDemoMode()) return;

    try {
      this.realtimeChannel = this.supabaseService.client
        .channel('db-leaderboard-changes')
        .on(
          'postgres_changes' as any,
          { event: '*', schema: 'public', table: 'predictions' } as any,
          () => {
            this.ngZone.run(() => this.fetchLeaderboard());
          }
        )
        .on(
          'postgres_changes' as any,
          { event: 'update', schema: 'public', table: 'matches', filter: 'status=eq.finished' } as any,
          () => {
            this.ngZone.run(() => this.fetchLeaderboard());
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription failed', err);
    }
  }

  /**
   * Runs local signal aggregator combining simulated competitor points and user points.
   */
  private recalculateDemoLeaderboard(): void {
    const matches = this.matchService.matches();
    const userScore = this.predictionService.userScore();
    const userPredCount = this.predictionService.completedCount();
    const activeProfile = this.authService.profile();

    const currentUserId = this.authService.session()?.user.id || 'demo-user-uuid';
    const currentUserName = activeProfile?.username || 'Tú (Predictor)';
    const currentUserAvatar = activeProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';

    const userEntry: LeaderboardUserEntry = {
      userId: currentUserId,
      userName: currentUserName,
      avatarUrl: currentUserAvatar,
      role: activeProfile?.role || 'user',
      points: userScore,
      totalPredicted: userPredCount
    };

    const competitorEntries: LeaderboardUserEntry[] = MOCK_COMPETITORS.map(comp => {
      let points = 0;
      let totalPredicted = 0;

      matches.forEach(m => {
        const pred = comp.predictionsSeed[m.id];
        if (pred) {
          totalPredicted++;
          if (m.status === 'finished' && m.result && pred === m.result) {
            points++;
          }
        }
      });

      return {
        userId: comp.userId,
        userName: comp.userName,
        avatarUrl: comp.avatarUrl,
        role: 'user',
        points,
        totalPredicted
      };
    });

    this.sortAndAssignRanks([userEntry, ...competitorEntries]);
  }

  /**
   * Generates and downloads a CSV file containing all user predictions and match results.
   */
  public async exportAllPredictionsCSV(): Promise<void> {
    if (this.isDemoMode()) {
      alert('La exportación de CSV no está disponible en el modo Demo.');
      return;
    }

    try {
      this._loading.set(true);

      // 1. Fetch all profiles
      const { data: profiles, error: pErr } = await this.supabaseService.client
        .from('profiles')
        .select('id, username');
      
      if (pErr) throw pErr;

      // 2. Fetch all predictions
      const { data: predictions, error: prErr } = await this.supabaseService.client
        .from('predictions')
        .select('user_id, match_id, prediction, points');

      if (prErr) throw prErr;

      // 3. Get matches from local service state
      const matches = this.matchService.matches();
      const matchMap = new Map<string, typeof matches[0]>();
      matches.forEach(m => matchMap.set(m.id, m));

      // 4. Create User Map
      // 4. Prepare Users (Columns)
      let users = profiles ? [...profiles] : [];
      // Ordenamos los usuarios alfabéticamente para las columnas
      users.sort((a, b) => (a.username || '').localeCompare(b.username || ''));

      // 5. Generate CSV Rows (Matrix Layout)
      // Primera fila: Cabeceras (Local, vs, Visitante, Usuario 1, Usuario 2...)
      const headerUsers = users.map(u => `"${(u.username || 'Usuario').replace(/"/g, '""')}"`);
      let csvContent = `Local,vs,Visitante,${headerUsers.join(',')}\n`;

      if (predictions) {
        // Mapeamos las predicciones: match_id -> user_id -> prediction
        const predMap = new Map<string, Map<string, string>>();
        predictions.forEach((pred: any) => {
          if (!predMap.has(pred.match_id)) predMap.set(pred.match_id, new Map<string, string>());
          predMap.get(pred.match_id)!.set(pred.user_id, pred.prediction);
        });

        // Ordenamos los partidos cronológicamente igual que en el dashboard
        const sortedMatches = [...matches].sort((a, b) => {
          const dateDiff = new Date(a.match_date).getTime() - new Date(b.match_date).getTime();
          if (dateDiff === 0) return a.round - b.round;
          return dateDiff;
        });

        // Generamos una fila por cada partido
        sortedMatches.forEach(match => {
          const cleanHome = `"${match.homeTeam.name.replace(/"/g, '""')}"`;
          const cleanAway = `"${match.awayTeam.name.replace(/"/g, '""')}"`;
          
          let row = `${cleanHome},vs,${cleanAway}`;
          
          // Agregamos la columna de cada usuario (L, E, V, o vacío)
          users.forEach(user => {
            const userPred = predMap.get(match.id)?.get(user.id) || '';
            row += `,${userPred}`;
          });
          
          csvContent += row + '\n';
        });
      }

      // 6. Trigger Download
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' }); // Added BOM for Excel UTF-8 support
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'predicciones_mundial_2026.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (e) {
      console.error('Error exportando CSV:', e);
      alert('Hubo un error al exportar los datos a CSV.');
    } finally {
      this._loading.set(true); // Keep UI responsive
      setTimeout(() => this._loading.set(false), 500);
    }
  }

  ngOnDestroy(): void {
    if (this.realtimeChannel) {
      this.supabaseService.client.removeChannel(this.realtimeChannel);
    }
  }
}
