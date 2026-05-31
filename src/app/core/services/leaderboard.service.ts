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

  ngOnDestroy(): void {
    if (this.realtimeChannel) {
      this.supabaseService.client.removeChannel(this.realtimeChannel);
    }
  }
}
