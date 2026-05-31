import { Component, signal, computed, inject } from '@angular/core';
import { MatchService } from '../../../core/services/match.service';
import { AuthService } from '../../../core/services/auth.service';
import { DbMatch, DbTeam, MatchStatus, PredictionType } from '../../../core/models/supabase.models';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-matches',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12 antialiased">
      
      <!-- Nav Header -->
      <header class="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-xl">⚙️</span>
            <div>
              <h1 class="text-sm sm:text-base font-black text-slate-50 tracking-tight flex items-center gap-1.5">
                Panel Administrador: Partidos
              </h1>
              <p class="text-[9px] text-slate-500 font-medium">Gestión del calendario del torneo</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <a routerLink="/dashboard" class="bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-[10px] px-3.5 py-1.5 rounded-xl transition-all border border-slate-700 shadow-sm">
              🏠 Volver Dashboard
            </a>
          </div>
        </div>
      </header>

      <!-- Grid -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Column 1: Creation and Import panels -->
          <div class="lg:col-span-1 space-y-6">
            
            <!-- Create Match Form -->
            <div class="backdrop-blur-md bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-1.5">
                <span>➕</span> Crear Partido
              </h3>

              <form (ngSubmit)="onCreateMatch()" class="space-y-3">
                <!-- Group Selection -->
                <div class="space-y-1">
                  <label class="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Grupo</label>
                  <select 
                    name="group_name" 
                    [(ngModel)]="newMatch.group_name"
                    class="w-full h-9 bg-slate-950 border border-slate-800 rounded-lg px-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    @for (g of groupsList; track g) {
                      <option [value]="g">Grupo {{ g }}</option>
                    }
                  </select>
                </div>

                <!-- Home Team Selection -->
                <div class="space-y-1">
                  <label class="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Equipo Local</label>
                  <select 
                    name="home_team_id" 
                    [(ngModel)]="newMatch.home_team_id"
                    class="w-full h-9 bg-slate-950 border border-slate-800 rounded-lg px-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    @for (t of filteredHomeTeams(); track t.id) {
                      <option [value]="t.id">{{ t.name }} ({{ t.code }})</option>
                    }
                  </select>
                </div>

                <!-- Away Team Selection -->
                <div class="space-y-1">
                  <label class="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Equipo Visitante</label>
                  <select 
                    name="away_team_id" 
                    [(ngModel)]="newMatch.away_team_id"
                    class="w-full h-9 bg-slate-950 border border-slate-800 rounded-lg px-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    @for (t of filteredAwayTeams(); track t.id) {
                      <option [value]="t.id">{{ t.name }} ({{ t.code }})</option>
                    }
                  </select>
                </div>

                <!-- Stadium -->
                <div class="space-y-1">
                  <label class="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Estadio Sede</label>
                  <input 
                    type="text" 
                    name="stadium" 
                    [(ngModel)]="newMatch.stadium" 
                    placeholder="ej. Estadio Azteca"
                    class="w-full h-9 bg-slate-950 border border-slate-800 rounded-lg px-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                <!-- Date & Kickoff Time -->
                <div class="space-y-1">
                  <label class="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Fecha y Hora de Juego</label>
                  <input 
                    type="datetime-local" 
                    name="match_date" 
                    [(ngModel)]="newMatch.match_date" 
                    class="w-full h-9 bg-slate-950 border border-slate-800 rounded-lg px-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-semibold"
                  />
                </div>

                <!-- Round/Jornada -->
                <div class="space-y-1">
                  <label class="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Jornada</label>
                  <select 
                    name="round" 
                    [(ngModel)]="newMatch.round"
                    class="w-full h-9 bg-slate-950 border border-slate-800 rounded-lg px-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option [value]="1">Jornada 1</option>
                    <option [value]="2">Jornada 2</option>
                    <option [value]="3">Jornada 3</option>
                  </select>
                </div>

                <!-- Submit Button -->
                <button 
                  type="submit" 
                  class="w-full h-9 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-lg shadow transition-all active:scale-[0.98] mt-2"
                >
                  Confirmar y Guardar
                </button>
              </form>
            </div>

            <!-- Import Matches Panel -->
            <div class="backdrop-blur-md bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-1.5">
                <span>📥</span> Importar desde JSON
              </h3>

              <div class="space-y-3">
                <textarea 
                  [(ngModel)]="jsonImportText"
                  placeholder="Pegue aquí el arreglo JSON de partidos..."
                  class="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] text-slate-300 font-mono focus:outline-none focus:border-emerald-500"
                ></textarea>
                
                <div class="flex justify-between items-center">
                  <button 
                    (click)="copySampleJson()" 
                    class="text-[9px] text-emerald-400 hover:underline font-bold"
                  >
                    📋 Copiar JSON Ejemplo
                  </button>
                  <button 
                    (click)="onImportMatches()"
                    class="h-7 bg-slate-800 hover:bg-slate-750 text-white font-bold text-[10px] px-3.5 rounded-lg border border-slate-700"
                  >
                    Importar Partidos
                  </button>
                </div>
              </div>
            </div>

          </div>

          <!-- Column 2 & 3: Calendar Table list -->
          <div class="lg:col-span-2 space-y-6">
            
            <div class="backdrop-blur-md bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div class="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-4">
                <h3 class="text-xs font-extrabold text-slate-350 uppercase tracking-widest flex items-center gap-2">
                  <span>📅</span> Calendario Registrado
                </h3>
                <span class="bg-slate-950 text-slate-400 text-xs px-2.5 py-0.5 rounded-full border border-slate-850 font-mono font-bold">
                  {{ matchService.matches().length }} Partidos
                </span>
              </div>

              <!-- Matches List -->
              <div class="overflow-y-auto max-h-[580px] pr-1 space-y-3.5">
                @for (m of matchService.matches(); track m.id) {
                  <div class="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-center justify-between gap-4">
                    <div class="space-y-1">
                      <!-- Group & Round Badge -->
                      <div class="flex items-center gap-2">
                        <span class="bg-slate-900 border border-slate-800 text-slate-400 text-[8px] font-bold px-1.5 py-0.2 rounded uppercase">Grupo {{ m.group_name }}</span>
                        <span class="bg-slate-900 border border-slate-800 text-slate-400 text-[8px] font-bold px-1.5 py-0.2 rounded uppercase">Jornada {{ m.round }}</span>
                      </div>
                      
                      <!-- Core Teams -->
                      <div class="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        <img [src]="m.homeTeam.flag_url" class="w-5.5 h-3.5 object-cover rounded border border-slate-800" />
                        <span>{{ m.homeTeam.name }}</span>
                        <span class="text-slate-500">vs</span>
                        <span>{{ m.awayTeam.name }}</span>
                        <img [src]="m.awayTeam.flag_url" class="w-5.5 h-3.5 object-cover rounded border border-slate-800" />
                      </div>

                      <div class="text-[9px] text-slate-500 font-medium">
                        🏟️ {{ m.stadium }} | 🕒 {{ m.match_date | date: 'dd/MM/yyyy HH:mm' }}
                      </div>
                    </div>

                    <!-- Status Controls -->
                    <div class="flex items-center gap-2">
                      <select 
                        [value]="m.status"
                        (change)="onStatusChanged(m.id, $any($event.target).value)"
                        class="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-bold px-2 py-1 rounded-lg focus:outline-none"
                      >
                        <option value="draft">Borrador</option>
                        <option value="scheduled">Programado (Publicado)</option>
                        <option value="published">Publicado</option>
                        <option value="closed">Cerrado</option>
                        <option value="finished">Finalizado</option>
                      </select>
                    </div>
                  </div>
                } @empty {
                  <div class="text-center py-12 text-xs text-slate-500 font-medium">
                    No hay partidos programados. Registra partidos o impórtalos para arrancar el torneo.
                  </div>
                }
              </div>
            </div>

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
export class AdminMatchesComponent {
  public readonly matchService = inject(MatchService);
  public readonly authService = inject(AuthService);

  // Group letters
  public readonly groupsList = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const;

  // New Match form bindings
  public newMatch = {
    group_name: 'A' as any,
    home_team_id: '',
    away_team_id: '',
    stadium: '',
    match_date: '',
    round: 1 as any,
    status: 'published' as MatchStatus
  };

  public jsonImportText = '';

  // Filtered teams list based on active group selection
  public readonly filteredHomeTeams = computed(() => {
    return this.matchService.teams().filter(t => t.group_name === this.newMatch.group_name);
  });

  public readonly filteredAwayTeams = computed(() => {
    return this.matchService.teams().filter(t => t.group_name === this.newMatch.group_name);
  });

  constructor() {
    // Select default teams if available
    const teams = this.matchService.teams();
    if (teams.length > 0) {
      this.autoSelectTeams();
    }
  }

  private autoSelectTeams(): void {
    const list = this.filteredHomeTeams();
    if (list.length >= 2) {
      this.newMatch.home_team_id = list[0].id;
      this.newMatch.away_team_id = list[1].id;
    }
  }

  /**
   * Fires match creation.
   */
  public async onCreateMatch(): Promise<void> {
    if (!this.newMatch.home_team_id || !this.newMatch.away_team_id || !this.newMatch.match_date || !this.newMatch.stadium) {
      alert('Por favor complete todos los campos obligatorios del partido.');
      return;
    }

    if (this.newMatch.home_team_id === this.newMatch.away_team_id) {
      alert('Un equipo no puede jugar contra sí mismo.');
      return;
    }

    const success = await this.matchService.createMatch({
      home_team_id: this.newMatch.home_team_id,
      away_team_id: this.newMatch.away_team_id,
      group_name: this.newMatch.group_name,
      round: Number(this.newMatch.round) as any,
      stadium: this.newMatch.stadium,
      match_date: new Date(this.newMatch.match_date).toISOString(),
      status: this.newMatch.status
    });

    if (success) {
      alert('¡Partido creado con éxito!');
      this.newMatch.stadium = '';
      this.newMatch.match_date = '';
    } else {
      alert('Error al crear partido.');
    }
  }

  /**
   * Triggers JSON imports.
   */
  public async onImportMatches(): Promise<void> {
    if (!this.jsonImportText.trim()) {
      alert('Por favor pegue un texto JSON válido.');
      return;
    }

    const result = await this.matchService.importMatchesFromJson(this.jsonImportText);
    alert(result.message);
    if (result.success) {
      this.jsonImportText = '';
    }
  }

  /**
   * Status change select binding.
   */
  public async onStatusChanged(matchId: string, status: MatchStatus): Promise<void> {
    const success = await this.matchService.updateMatchStatus(matchId, status);
    if (!success) {
      alert('Error al actualizar estado del partido.');
    }
  }

  /**
   * Copies sample json block for administrator usage.
   */
  public copySampleJson(): void {
    const teams = this.matchService.teams();
    if (teams.length < 2) {
      alert('No hay suficientes equipos registrados en base de datos para generar un JSON de muestra.');
      return;
    }

    const hTeam = teams[0];
    const aTeam = teams[1];

    const sample = [
      {
        home_team_id: hTeam.id,
        away_team_id: aTeam.id,
        group_name: hTeam.group_name,
        round: 1,
        stadium: 'SoFi Stadium',
        match_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        status: 'published'
      }
    ];

    this.jsonImportText = JSON.stringify(sample, null, 2);
    alert('JSON muestra copiado e insertado en el editor. ¡Revíselo!');
  }
}
