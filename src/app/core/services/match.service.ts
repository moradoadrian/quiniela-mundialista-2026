import { Injectable, signal, computed, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { DbMatch, DbTeam, MatchWithTeams, MatchStatus, PredictionType } from '../models/supabase.models';
import { generate72Matches } from '../mock/quiniela.mock';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  private readonly supabaseService = inject(SupabaseService);

  // central writable signals for state
  private readonly _matches = signal<MatchWithTeams[]>([]);
  private readonly _teams = signal<DbTeam[]>([]);
  private readonly _loading = signal<boolean>(false);

  // public read-only signals
  public readonly matches = computed(() => this._matches());
  public readonly teams = computed(() => this._teams());
  public readonly loading = computed(() => this._loading());

  // Demo Fallback configuration
  private readonly isDemoMode = computed(() => {
    return environment.supabaseUrl.includes('your-supabase-project');
  });

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    this._loading.set(true);
    await this.fetchTeams();
    await this.fetchMatches();
    this._loading.set(false);
  }

  /**
   * Loads all qualified teams from database.
   */
  public async fetchTeams(): Promise<void> {
    if (this.isDemoMode()) {
      const cached = localStorage.getItem('demo_teams');
      if (cached) {
        this._teams.set(JSON.parse(cached));
      } else {
        // Extract teams from our standard mock
        const mockMatches = generate72Matches();
        const extracted: Record<string, DbTeam> = {};
        mockMatches.forEach(m => {
          extracted[m.homeTeam.name] = {
            id: m.homeTeam.id,
            name: m.homeTeam.name,
            code: m.homeTeam.code,
            flag_url: m.homeTeam.flagUrl,
            group_name: m.group as any
          };
          extracted[m.awayTeam.name] = {
            id: m.awayTeam.id,
            name: m.awayTeam.name,
            code: m.awayTeam.code,
            flag_url: m.awayTeam.flagUrl,
            group_name: m.group as any
          };
        });
        const teamList = Object.values(extracted);
        localStorage.setItem('demo_teams', JSON.stringify(teamList));
        this._teams.set(teamList);
      }
      return;
    }

    try {
      const { data, error } = await this.supabaseService.client
        .from('teams')
        .select('*')
        .order('name');
      if (data) {
        this._teams.set(data as DbTeam[]);
      }
    } catch (e) {
      console.error('Error fetching teams from Supabase', e);
    }
  }

  /**
   * Team CRUD: Creates a team
   */
  public async createTeam(team: Omit<DbTeam, 'id'>): Promise<boolean> {
    if (this.isDemoMode()) {
      const newTeam: DbTeam = { ...team, id: 'team-' + Math.random().toString(36).substr(2, 9) };
      const list = [...this._teams(), newTeam];
      this._teams.set(list);
      localStorage.setItem('demo_teams', JSON.stringify(list));
      return true;
    }

    try {
      const { error } = await this.supabaseService.client.from('teams').insert(team);
      if (error) throw error;
      await this.fetchTeams();
      return true;
    } catch (e) {
      console.error('Error creating team', e);
      return false;
    }
  }

  /**
   * Team CRUD: Edits a team
   */
  public async updateTeam(teamId: string, team: Partial<DbTeam>): Promise<boolean> {
    if (this.isDemoMode()) {
      const list = this._teams().map(t => t.id === teamId ? { ...t, ...team } : t);
      this._teams.set(list);
      localStorage.setItem('demo_teams', JSON.stringify(list));
      return true;
    }

    try {
      const { error } = await this.supabaseService.client.from('teams').update(team).eq('id', teamId);
      if (error) throw error;
      await this.fetchTeams();
      return true;
    } catch (e) {
      console.error('Error updating team', e);
      return false;
    }
  }

  /**
   * Team CRUD: Removes a team
   */
  public async deleteTeam(teamId: string): Promise<boolean> {
    if (this.isDemoMode()) {
      const list = this._teams().filter(t => t.id !== teamId);
      this._teams.set(list);
      localStorage.setItem('demo_teams', JSON.stringify(list));
      return true;
    }

    try {
      const { error } = await this.supabaseService.client.from('teams').delete().eq('id', teamId);
      if (error) throw error;
      await this.fetchTeams();
      return true;
    } catch (e) {
      console.error('Error deleting team', e);
      return false;
    }
  }

  /**
   * Loads matches and resolves homeTeam / awayTeam relational structures.
   */
  public async fetchMatches(): Promise<void> {
    if (this.isDemoMode()) {
      const cached = localStorage.getItem('demo_matches');
      if (cached) {
        this._matches.set(JSON.parse(cached));
      } else {
        // Map old mock matches to our Supabase schema
        const mockMatches = generate72Matches();
        const teams = this._teams();
        const mapped: MatchWithTeams[] = mockMatches.map(m => {
          const homeDb = teams.find(t => t.name === m.homeTeam.name) || {
            id: m.homeTeam.id,
            name: m.homeTeam.name,
            code: m.homeTeam.code,
            flag_url: m.homeTeam.flagUrl,
            group_name: m.group as any
          };
          const awayDb = teams.find(t => t.name === m.awayTeam.name) || {
            id: m.awayTeam.id,
            name: m.awayTeam.name,
            code: m.awayTeam.code,
            flag_url: m.awayTeam.flagUrl,
            group_name: m.group as any
          };

          return {
            id: m.id,
            group_name: m.group,
            round: m.matchday,
            stadium: m.stadium || 'MetLife Stadium',
            match_date: m.date,
            home_score: m.homeGoals,
            away_score: m.awayGoals,
            result: m.realResult,
            status: m.realResult ? 'finished' : 'published',
            homeTeam: homeDb,
            awayTeam: awayDb
          };
        });
        localStorage.setItem('demo_matches', JSON.stringify(mapped));
        this._matches.set(mapped);
      }
      return;
    }

    try {
      // Join queries to get team info in a single fetch
      const { data, error } = await this.supabaseService.client
        .from('matches')
        .select(`
          id,
          group_name,
          round,
          stadium,
          match_date,
          home_score,
          away_score,
          result,
          status,
          homeTeam:teams!matches_home_team_id_fkey(*),
          awayTeam:teams!matches_away_team_id_fkey(*)
        `)
        .order('match_date');

      if (data) {
        this._matches.set(data as unknown as MatchWithTeams[]);
      }
    } catch (e) {
      console.error('Error fetching matches from Supabase', e);
    }
  }

  /**
   * Matches CRUD: Creates a match record
   */
  public async createMatch(match: Omit<DbMatch, 'id' | 'result'>): Promise<boolean> {
    if (this.isDemoMode()) {
      const hTeam = this._teams().find(t => t.id === match.home_team_id)!;
      const aTeam = this._teams().find(t => t.id === match.away_team_id)!;
      
      const newMatch: MatchWithTeams = {
        id: 'M-' + Math.random().toString(36).substr(2, 9),
        group_name: match.group_name,
        round: match.round,
        stadium: match.stadium,
        match_date: match.match_date,
        home_score: match.home_score,
        away_score: match.away_score,
        result: null,
        status: match.status,
        homeTeam: hTeam,
        awayTeam: aTeam
      };
      
      const list = [...this._matches(), newMatch];
      this._matches.set(list);
      localStorage.setItem('demo_matches', JSON.stringify(list));
      return true;
    }

    try {
      const { error } = await this.supabaseService.client.from('matches').insert({
        home_team_id: match.home_team_id,
        away_team_id: match.away_team_id,
        group_name: match.group_name,
        round: match.round,
        stadium: match.stadium,
        match_date: match.match_date,
        status: match.status
      });
      if (error) throw error;
      await this.fetchMatches();
      return true;
    } catch (e) {
      console.error('Error creating match', e);
      return false;
    }
  }

  /**
   * Matches CRUD: Updates match parameters
   */
  public async updateMatch(matchId: string, match: Partial<DbMatch>): Promise<boolean> {
    if (this.isDemoMode()) {
      const list = this._matches().map(m => {
        if (m.id === matchId) {
          const merged = { ...m, ...match };
          // If scores are updated, calculate outcome
          if (match.home_score !== undefined && match.away_score !== undefined) {
            merged.status = 'finished';
            merged.result = match.home_score > match.away_score 
              ? 'L' 
              : match.home_score < match.away_score ? 'V' : 'E';
          }
          return merged;
        }
        return m;
      });
      this._matches.set(list);
      localStorage.setItem('demo_matches', JSON.stringify(list));
      return true;
    }

    try {
      const { error } = await this.supabaseService.client.from('matches').update(match).eq('id', matchId);
      if (error) throw error;
      await this.fetchMatches();
      return true;
    } catch (e) {
      console.error('Error updating match', e);
      return false;
    }
  }

  /**
   * Sets final scores and resolves outcomes.
   */
  public async setMatchScore(matchId: string, homeScore: number, awayScore: number): Promise<boolean> {
    return this.updateMatch(matchId, {
      home_score: homeScore,
      away_score: awayScore,
      status: 'finished'
    });
  }

  /**
   * Alters publication status.
   */
  public async updateMatchStatus(matchId: string, status: MatchStatus): Promise<boolean> {
    return this.updateMatch(matchId, { status });
  }

  /**
   * Bulk imports matches from a raw JSON array.
   */
  public async importMatchesFromJson(jsonString: string): Promise<{ success: boolean; count: number; message: string }> {
    try {
      const matchesArray = JSON.parse(jsonString);
      if (!Array.isArray(matchesArray)) {
        throw new Error('El JSON provisto debe ser un arreglo de partidos.');
      }

      let count = 0;
      for (const item of matchesArray) {
        // Validate required fields
        if (item.home_team_id && item.away_team_id && item.group_name && item.round && item.match_date) {
          const success = await this.createMatch({
            home_team_id: item.home_team_id,
            away_team_id: item.away_team_id,
            group_name: item.group_name,
            round: item.round,
            stadium: item.stadium || 'Estadio Copa',
            match_date: item.match_date,
            status: item.status || 'published'
          });
          if (success) count++;
        }
      }

      return { success: true, count, message: `Se importaron ${count} partidos con éxito.` };
    } catch (e: any) {
      return { success: false, count: 0, message: e.message || 'Error al procesar el archivo JSON.' };
    }
  }
}
