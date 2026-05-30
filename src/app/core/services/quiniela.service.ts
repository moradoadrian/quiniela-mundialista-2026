import { Injectable, signal, computed, effect } from '@angular/core';
import { Match, PredictionType, LeaderboardEntry, UserPredictions } from '../models/quiniela.models';
import { generate72Matches, MOCK_COMPETITORS } from '../mock/quiniela.mock';

@Injectable({
  providedIn: 'root'
})
export class QuinielaService {
  // Private Writable Signals representing state
  private readonly _matches = signal<Match[]>([]);
  private readonly _userPredictions = signal<Record<string, PredictionType>>({});
  private readonly _currentUser = signal<{ id: string; name: string; avatarUrl?: string }>({
    id: 'user-current',
    name: 'Tú (Predictor)',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
  });
  private readonly _isLoading = signal<boolean>(false);
  private readonly _syncing = signal<boolean>(false);

  // Public Read-Only Signals (Derived State)
  public readonly matches = computed(() => this._matches());
  public readonly userPredictions = computed(() => this._userPredictions());
  public readonly currentUser = computed(() => this._currentUser());
  public readonly isLoading = computed(() => this._isLoading());
  public readonly isSyncing = computed(() => this._syncing());

  // Count and percentage of user prediction progress (72 matches total)
  public readonly totalMatchesCount = computed(() => this._matches().length);
  
  public readonly completedPredictionsCount = computed(() => {
    return Object.keys(this._userPredictions()).length;
  });

  public readonly progressPercentage = computed(() => {
    const total = this.totalMatchesCount();
    if (total === 0) return 0;
    return Math.round((this.completedPredictionsCount() / total) * 100);
  });

  // Calculate current user's score in real-time (1 point per match whose realResult matches the user's prediction)
  public readonly currentUserScore = computed(() => {
    let score = 0;
    const predictions = this._userPredictions();
    
    this._matches().forEach(match => {
      if (match.realResult && predictions[match.id] === match.realResult) {
        score++;
      }
    });
    
    return score;
  });

  // Leaderboard signal recalculated dynamically in real-time
  public readonly leaderboard = computed<LeaderboardEntry[]>(() => {
    const activeMatches = this._matches();
    const currentPreds = this._userPredictions();
    const currentUsr = this._currentUser();

    // 1. Calculate score for the active user
    const userEntry: LeaderboardEntry = {
      userId: currentUsr.id,
      userName: currentUsr.name,
      avatarUrl: currentUsr.avatarUrl,
      points: this.currentUserScore(),
      totalPredicted: this.completedPredictionsCount()
    };

    // 2. Calculate scores for mock competitors based on simulated predictions
    const competitorEntries: LeaderboardEntry[] = MOCK_COMPETITORS.map(comp => {
      let points = 0;
      let totalPredicted = 0;
      
      activeMatches.forEach(match => {
        const pred = comp.predictionsSeed[match.id];
        if (pred) {
          totalPredicted++;
          if (match.realResult && pred === match.realResult) {
            points++;
          }
        }
      });

      return {
        userId: comp.userId,
        userName: comp.userName,
        avatarUrl: comp.avatarUrl,
        points,
        totalPredicted
      };
    });

    // 3. Combine and rank them
    const allEntries = [userEntry, ...competitorEntries];
    
    return allEntries
      .sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points; // Higher score first
        }
        return b.totalPredicted - a.totalPredicted; // Tie-breaker: most predicted matches
      })
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));
  });

  constructor() {
    this.loadInitialData();
    
    // Save predictions to localStorage automatically as a local fallback
    effect(() => {
      const preds = this._userPredictions();
      if (Object.keys(preds).length > 0) {
        localStorage.setItem('quiniela_predictions_v1', JSON.stringify(preds));
      }
    });
  }

  /**
   * Initializes state by loading matches from our mock catalog and checking localStorage.
   * Outlines the integration for future REST/BaaS calls.
   */
  public loadInitialData(): void {
    this._isLoading.set(true);
    
    // Simulating asynchronous API Fetch (e.g., GET /api/matches)
    setTimeout(() => {
      const matchesData = generate72Matches();
      this._matches.set(matchesData);

      // Load saved predictions from localStorage
      const cached = localStorage.getItem('quiniela_predictions_v1');
      if (cached) {
        try {
          this._userPredictions.set(JSON.parse(cached));
        } catch (e) {
          console.error('Error parsing cached predictions', e);
        }
      }
      
      this._isLoading.set(false);
    }, 600);
  }

  /**
   * Registers or updates a user's L-E-V prediction for a match.
   * Sinks changes in local state and triggers dynamic recalculations via signals.
   * 
   * @param matchId ID of the match to predict.
   * @param prediction Prediction selection ('L' | 'E' | 'V').
   */
  public setPrediction(matchId: string, prediction: PredictionType): void {
    const current = { ...this._userPredictions() };
    
    // Toggle prediction off if clicking the already selected option
    if (current[matchId] === prediction) {
      delete current[matchId];
    } else {
      current[matchId] = prediction;
    }
    
    this._userPredictions.set(current);
    
    // Future REST integration outline (e.g., PUT /api/predictions)
    this.syncPredictionWithBackend(matchId, current[matchId] || null);
  }

  /**
   * Resolves the selected prediction for a given match.
   */
  public getPredictionForMatch(matchId: string): PredictionType | null {
    return this._userPredictions()[matchId] || null;
  }

  /**
   * Resets all selections made by the user.
   */
  public resetAllPredictions(): void {
    this._userPredictions.set({});
    localStorage.removeItem('quiniela_predictions_v1');
  }

  /**
   * Sinks a singular prediction update to the API (non-blocking simulation).
   */
  private syncPredictionWithBackend(matchId: string, prediction: PredictionType | null): void {
    this._syncing.set(true);
    // Simulating discrete HTTP PUT request to sync prediction
    // HttpClient.put(`/api/predictions/${matchId}`, { prediction })
    setTimeout(() => {
      this._syncing.set(false);
    }, 300);
  }

  /**
   * Bulk sync method for complete online database backup (firebase/supabase/SQL).
   */
  public async syncAllPredictions(): Promise<boolean> {
    this._isLoading.set(true);
    
    // Simulating API POST /api/predictions/sync
    return new Promise((resolve) => {
      setTimeout(() => {
        this._isLoading.set(false);
        resolve(true);
      }, 1000);
    });
  }
}
