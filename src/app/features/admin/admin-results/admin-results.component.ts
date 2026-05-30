import { Component, signal, inject, effect } from '@angular/core';
import { MatchService } from '../../../core/services/match.service';
import { LeaderboardService } from '../../../core/services/leaderboard.service';
import { PredictionService } from '../../../core/services/prediction.service';
import { MatchWithTeams, PredictionType } from '../../../core/models/supabase.models';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-results',
  standalone: true,
  imports: [NgClass, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12 antialiased">
      
      <!-- Nav Header -->
      <header class="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-xl">🏅</span>
            <div>
              <h1 class="text-sm sm:text-base font-black text-slate-50 tracking-tight flex items-center gap-1.5">
                Panel Administrador: Resultados
              </h1>
              <p class="text-[9px] text-slate-500 font-medium">Resolución de marcadores del mundial</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <a routerLink="/dashboard" class="bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-[10px] px-3.5 py-1.5 rounded-xl transition-all border border-slate-700 shadow-sm">
              🏠 Volver Dashboard
            </a>
          </div>
        </div>
      </header>

      <!-- Main container -->
      <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        <div class="backdrop-blur-md bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-6">
          <div class="flex items-center justify-between pb-3.5 border-b border-slate-800">
            <div>
              <h3 class="text-xs font-extrabold text-slate-350 uppercase tracking-widest">
                📋 Registro de Marcadores
              </h3>
              <p class="text-[9px] text-slate-600 font-medium mt-0.5">Captura goles e inicia el cálculo automatizado de aciertos</p>
            </div>
            
            <span class="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] px-2.5 py-1 rounded-full font-black uppercase">
              Admin Mode
            </span>
          </div>

          <!-- Matches Scoring Rows -->
          <div class="space-y-4">
            @for (m of matchService.matches(); track m.id) {
              <!-- Row item -->
              <div 
                class="bg-slate-950 border p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-all"
                [ngClass]="{
                  'border-slate-850/80': m.status !== 'finished',
                  'border-amber-500/25 bg-amber-500/[0.01]': m.status === 'finished'
                }"
              >
                <!-- Match Details -->
                <div class="space-y-1 text-center sm:text-left flex-1 min-w-0">
                  <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span class="bg-slate-900 border border-slate-800 text-slate-400 text-[8px] font-bold px-1.5 py-0.2 rounded uppercase">Grupo {{ m.group_name }}</span>
                    <span class="bg-slate-900 border border-slate-800 text-slate-400 text-[8px] font-bold px-1.5 py-0.2 rounded uppercase">Jornada {{ m.round }}</span>
                    @if (m.status === 'finished') {
                      <span class="bg-emerald-500/10 text-emerald-450 border border-emerald-500/25 text-[8px] font-bold px-1.5 py-0.2 rounded uppercase">Cerrado e Impreso</span>
                    }
                  </div>
                  
                  <!-- Match Header -->
                  <div class="text-xs font-bold text-slate-100 flex items-center justify-center sm:justify-start gap-1.5 pt-1.5">
                    <img [src]="m.homeTeam.flag_url" class="w-5 h-3 object-cover rounded border border-slate-800 shadow-sm" />
                    <span>{{ m.homeTeam.name }}</span>
                    <span class="text-slate-600 font-bold font-mono">VS</span>
                    <span>{{ m.awayTeam.name }}</span>
                    <img [src]="m.awayTeam.flag_url" class="w-5 h-3 object-cover rounded border border-slate-800 shadow-sm" />
                  </div>
                </div>

                <!-- Live Result Inputs -->
                <div class="flex items-center gap-3.5 bg-slate-900/60 border border-slate-850 px-4 py-2.5 rounded-xl shadow-inner">
                  <!-- Home Input -->
                  <div class="flex flex-col items-center gap-0.5">
                    <span class="text-[8px] text-slate-550 font-bold uppercase tracking-wider">Local</span>
                    <input 
                      type="number" 
                      min="0"
                      [(ngModel)]="scores[m.id + '_home']"
                      (ngModelChange)="previewResult(m.id)"
                      placeholder="0"
                      class="w-10 h-8 bg-slate-950 border border-slate-800 rounded text-center text-xs text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <span class="text-slate-650 font-extrabold text-xs mt-3">-</span>

                  <!-- Away Input -->
                  <div class="flex flex-col items-center gap-0.5">
                    <span class="text-[8px] text-slate-550 font-bold uppercase tracking-wider">Visita</span>
                    <input 
                      type="number" 
                      min="0"
                      [(ngModel)]="scores[m.id + '_away']"
                      (ngModelChange)="previewResult(m.id)"
                      placeholder="0"
                      class="w-10 h-8 bg-slate-950 border border-slate-800 rounded text-center text-xs text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <!-- Dynamic outcome calculation indicator -->
                  <div class="flex flex-col items-center border-l border-slate-800 pl-3">
                    <span class="text-[7px] text-slate-550 font-extrabold uppercase tracking-wider block">Resultado</span>
                    <span 
                      class="text-xs font-black font-mono w-5 h-5 flex items-center justify-center rounded mt-1.5 shadow"
                      [ngClass]="{
                        'bg-blue-600/25 text-blue-400 border border-blue-500/25': previews[m.id] === 'L',
                        'bg-red-650/25 text-red-400 border border-red-500/25': previews[m.id] === 'V',
                        'bg-slate-800 text-slate-400 border border-slate-700': previews[m.id] === 'E',
                        'bg-slate-950 text-slate-600': !previews[m.id]
                      }"
                    >
                      {{ previews[m.id] || '-' }}
                    </span>
                  </div>
                </div>

                <!-- Action Button -->
                <div>
                  <button 
                    (click)="onSaveResult(m.id)"
                    [disabled]="scores[m.id + '_home'] === undefined || scores[m.id + '_away'] === undefined"
                    class="h-9 w-full sm:w-auto bg-amber-500 hover:bg-amber-450 disabled:opacity-40 text-slate-950 font-black text-xs px-4 rounded-lg shadow-md transition-all active:scale-[0.97]"
                  >
                    💾 Guardar
                  </button>
                </div>

              </div>
            } @empty {
              <div class="text-center py-12 text-xs text-slate-500 font-medium">
                No hay partidos activos para cargar resultados.
              </div>
            }
          </div>
        </div>

      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AdminResultsComponent {
  public readonly matchService = inject(MatchService);
  public readonly leaderboardService = inject(LeaderboardService);
  public readonly predictionService = inject(PredictionService);

  // Writable local states for forms
  public scores: Record<string, number> = {};
  public previews: Record<string, PredictionType | null> = {};

  constructor() {
    effect(() => {
      this.populateExistingScores();
    });
  }

  private populateExistingScores(): void {
    // Fill scores from resolved matches only if they haven't been populated yet to avoid overwriting edits
    const list = this.matchService.matches();
    list.forEach(m => {
      if (m.status === 'finished' && m.home_score !== undefined && m.away_score !== undefined) {
        if (this.scores[m.id + '_home'] === undefined) {
          this.scores[m.id + '_home'] = m.home_score;
          this.scores[m.id + '_away'] = m.away_score;
          this.previews[m.id] = m.result;
        }
      }
    });
  }

  /**
   * Evaluates the outcome locally as goals are entered.
   */
  public previewResult(matchId: string): void {
    const home = this.scores[matchId + '_home'];
    const away = this.scores[matchId + '_away'];

    if (home === undefined || away === undefined || home === null || away === null) {
      this.previews[matchId] = null;
      return;
    }

    if (home > away) {
      this.previews[matchId] = 'L';
    } else if (home < away) {
      this.previews[matchId] = 'V';
    } else {
      this.previews[matchId] = 'E';
    }
  }

  /**
   * Persists scores and triggers ranking updates.
   */
  public async onSaveResult(matchId: string): Promise<void> {
    const home = this.scores[matchId + '_home'];
    const away = this.scores[matchId + '_away'];

    if (home === undefined || away === undefined || home === null || away === null) {
      alert('Especifica goles válidos para ambos equipos.');
      return;
    }

    const success = await this.matchService.setMatchScore(matchId, home, away);
    if (success) {
      alert('¡Marcador oficial registrado con éxito! Tabla de posiciones y aciertos recalculados.');
      // Hot refresh rankings
      await this.predictionService.fetchUserPredictions();
      await this.leaderboardService.fetchLeaderboard();
    } else {
      alert('Error al guardar el marcador.');
    }
  }
}
