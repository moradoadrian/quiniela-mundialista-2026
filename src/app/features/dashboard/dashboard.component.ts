import { Component, ChangeDetectionStrategy, signal, computed, inject, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgClass, NgIf } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { MatchService } from '../../core/services/match.service';
import { PredictionService } from '../../core/services/prediction.service';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import { DashboardStatsComponent } from '../../shared/components/dashboard-stats/dashboard-stats.component';
import { MatchListComponent } from '../../shared/components/match-list/match-list.component';
import { LeaderboardComponent } from '../../shared/components/leaderboard/leaderboard.component';
import { PredictionType } from '../../core/models/supabase.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass, 
    NgIf,
    RouterLink, 
    DashboardStatsComponent, 
    MatchListComponent, 
    LeaderboardComponent
  ],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12 antialiased">
      
      <!-- Glassmorphic Header -->
      <header class="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <!-- Logo -->
          <div class="flex items-center gap-3">
            <svg class="w-7 h-7 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h1 class="text-sm sm:text-base font-black text-slate-50 tracking-tight flex items-center gap-1.5">
                Quiniela Mundialista 2026
                @if (authService.isAdmin()) {
                  <span class="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Admin</span>
                }
              </h1>
              <p class="text-[9px] text-slate-500 font-medium">Supabase Realtime Dashboard</p>
            </div>
          </div>

          <!-- Actions & User Profile -->
          <div class="flex items-center gap-3">
            @if (authService.isAdmin()) {
              <div class="hidden md:flex items-center gap-2">
                <a 
                  routerLink="/admin/matches"
                  class="bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-350 hover:text-white font-bold text-[10px] px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Partidos
                </a>
                <a 
                  routerLink="/admin/results"
                  class="bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-350 hover:text-white font-bold text-[10px] px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Resultados
                </a>
              </div>
            }

            <!-- User Info Badge -->
            <div class="flex items-center gap-2 bg-slate-900 border border-slate-850 px-2.5 py-1 rounded-full shadow-sm">
              <ng-container *ngIf="authService.isLoading(); else profileLoaded">
                <!-- Skeleton Profile Loader -->
                <div class="w-7 h-7 rounded-full bg-slate-800 animate-pulse border border-slate-700"></div>
                <div class="h-3 w-16 bg-slate-800 animate-pulse rounded hidden sm:inline"></div>
              </ng-container>
              <ng-template #profileLoaded>
                <!-- Profile Avatar with Initials Fallback -->
                <ng-container *ngIf="authService.profile()?.avatar_url; else initialsFallback">
                  <img 
                    [src]="authService.profile()?.avatar_url" 
                    alt="Avatar" 
                    class="w-7 h-7 rounded-full object-cover border border-slate-700 shadow-sm"
                  />
                </ng-container>
                <ng-template #initialsFallback>
                  <div class="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-650 text-slate-950 font-black text-[10px] flex items-center justify-center uppercase shadow border border-slate-750 select-none">
                    {{ getUserInitials() }}
                  </div>
                </ng-template>
                
                <!-- Profile details -->
                <div class="flex flex-col text-left hidden sm:flex">
                  <span class="text-xs font-black text-slate-200 leading-none">
                    {{ username }}
                  </span>
                  <span class="text-[8px] text-slate-500 font-bold uppercase tracking-wider leading-none mt-0.5">
                    {{ roleLabel }}
                  </span>
                </div>
              </ng-template>

              <!-- Score points -->
              <div class="bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm shadow-amber-500/10">
                <svg class="w-3 h-3 text-amber-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span class="font-mono">{{ predictionService.userScore() }}</span> pts
              </div>
            </div>

            <!-- Logout -->
            <button 
              (click)="onLogout()"
              class="w-8 h-8 rounded-full bg-slate-900 border border-slate-850 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              title="Cerrar Sesión"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <!-- Main Layout Container -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        <!-- Offline Sync Panel Alert (Flushes local caching queue) -->
        @if (hasOfflineQueue()) {
          <div class="bg-blue-950/20 border border-blue-500/30 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="bg-blue-900/50 p-2 rounded-xl text-blue-400 shadow-inner">
                <svg class="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <div class="text-center sm:text-left">
                <h5 class="text-xs font-bold text-blue-300">Tienes predicciones guardadas localmente</h5>
                <p class="text-[10px] text-slate-450 mt-0.5">Te encuentras fuera de línea o Supabase está inactivo. Sincroniza tus datos.</p>
              </div>
            </div>
            <button 
              (click)="syncOfflineData()"
              [disabled]="predictionService.syncing()"
              class="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-extrabold text-[10px] px-4 py-2 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              @if (predictionService.syncing()) {
                <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              } @else {
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              }
              Sincronizar Ahora
            </button>
          </div>
        }

        <!-- Gamified Dashboard Statistics Widgets -->
        <app-dashboard-stats
          [completedCount]="predictionService.completedCount()"
          [totalCount]="matchService.matches().length"
          [percentage]="predictionService.completionPercentage()"
          [score]="predictionService.userScore()"
          [streak]="predictionService.predictionStreaks()"
        ></app-dashboard-stats>

        <!-- Admin Mobile Fast Navigator Link -->
        @if (authService.isAdmin()) {
          <div class="md:hidden bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-around gap-2 mb-6">
            <a 
              routerLink="/admin/matches"
              class="flex-1 bg-slate-800 hover:bg-slate-750 text-center font-bold text-xs py-2 rounded-xl border border-slate-700 text-slate-300 flex items-center justify-center gap-1.5"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Gestionar Partidos
            </a>
            <a 
              routerLink="/admin/results"
              class="flex-1 bg-slate-800 hover:bg-slate-750 text-center font-bold text-xs py-2 rounded-xl border border-slate-700 text-slate-300 flex items-center justify-center gap-1.5"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Cargar Resultados
            </a>
          </div>
        }

        <!-- 2-Columns grid layout -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Column 1 & 2: Matches Area -->
          <div class="lg:col-span-2 space-y-6">
            
            <!-- Filters Bar -->
            <div class="backdrop-blur-md bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
              <!-- Group Filter -->
              <div>
                <label class="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block mb-2.5">
                  Filtrar por Grupo Mundialista
                </label>
                <div class="flex flex-wrap gap-1.5">
                  @for (grp of groupsList; track grp) {
                    <button 
                      (click)="selectedGroup.set(grp)"
                      class="h-7 min-w-[30px] px-2 rounded-lg text-[11px] font-extrabold transition-all border flex items-center justify-center"
                      [ngClass]="{
                        'bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-sm': selectedGroup() === grp,
                        'bg-slate-950 border-slate-850 text-slate-450 hover:bg-slate-800 hover:text-white hover:border-slate-750': selectedGroup() !== grp
                      }"
                    >
                      {{ grp === 'TODOS' ? 'Todos' : grp }}
                    </button>
                  }
                </div>
              </div>

              <!-- Separator -->
              <div class="border-t border-slate-800/60"></div>

              <!-- Matchday Filter -->
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <label class="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block mb-1">
                    Jornada Oficial
                  </label>
                  <p class="text-[9px] text-slate-600 font-medium">Filtrar encuentros por fase calendario</p>
                </div>
                <div class="flex gap-1.5">
                  @for (day of matchdaysList; track day) {
                    <button 
                      (click)="selectedMatchday.set(day)"
                      class="h-7 px-3.5 rounded-lg text-[11px] font-bold transition-all border flex items-center justify-center"
                      [ngClass]="{
                        'bg-slate-100 border-slate-200 text-slate-950 font-black': selectedMatchday() === day,
                        'bg-slate-950 border-slate-850 text-slate-450 hover:bg-slate-800 hover:text-white hover:border-slate-750': selectedMatchday() !== day
                      }"
                    >
                      {{ day === 'TODOS' ? 'Todas las Jornadas' : 'Jornada ' + day }}
                    </button>
                  }
                </div>
              </div>
            </div>

            <!-- Title Header -->
            <div class="flex items-center justify-between px-2">
              <h3 class="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Partidos Disponibles
                <span class="bg-slate-900 text-slate-400 text-[10px] px-2.5 py-0.5 rounded-full border border-slate-850 font-mono font-bold">
                  {{ filteredMatches().length }}
                </span>
              </h3>
              <p class="text-[10px] text-slate-500">
                Grupo: <strong class="text-slate-350">{{ selectedGroup() }}</strong> | Jornada: <strong class="text-slate-350">{{ selectedMatchday() }}</strong>
              </p>
            </div>

            <!-- Matches List Component -->
            <app-match-list
              [matches]="filteredMatches()"
              [predictions]="predictionService.predictions()"
              [loading]="matchService.loading() || predictionService.loading()"
              (predictionSelected)="onPredictionSelected($event)"
            ></app-match-list>

          </div>

          <!-- Column 3: Sidebar Leaderboard -->
          <div id="leaderboard-section" class="lg:col-span-1 space-y-6">
            
            <!-- Realtime Leaderboard -->
            <app-leaderboard
              [entries]="leaderboardService.leaderboard()"
              [currentUserId]="authService.session()?.user?.id || ''"
            ></app-leaderboard>

            <!-- User Quick Stats Breakdown card -->
            <div class="backdrop-blur-md bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <h4 class="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Resumen Analítico
              </h4>
              
              <div class="space-y-3">
                <div class="flex justify-between items-center text-xs">
                  <span class="text-slate-500">Aciertos Totales</span>
                  <span class="font-bold text-slate-200 font-mono">{{ predictionService.userScore() }}</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                  <span class="text-slate-500">Porcentaje de Precisión</span>
                  <span class="font-bold text-emerald-400 font-mono">{{ hitRate() }}%</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                  <span class="text-slate-500">Predicciones Completas</span>
                  <span class="font-bold text-blue-400 font-mono">{{ predictionService.completedCount() }}/72</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>

      <!-- Botón Flotante para Móviles (Opción A) -->
      <button 
        (click)="scrollToLeaderboard()"
        class="lg:hidden fixed bottom-6 right-6 z-50 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-3 rounded-full shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-transform active:scale-95 flex items-center gap-2 border border-emerald-400"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <span class="text-xs uppercase tracking-wider">Ver Ranking</span>
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class DashboardComponent {
  public readonly authService = inject(AuthService);
  public readonly matchService = inject(MatchService);
  public readonly predictionService = inject(PredictionService);
  public readonly leaderboardService = inject(LeaderboardService);
  private readonly router = inject(Router);

  // Writable Signals for filters
  public readonly selectedGroup = signal<string>('TODOS');
  public readonly selectedMatchday = signal<number | 'TODOS'>('TODOS');

  // Groups and matchdays list catalogs
  public readonly groupsList = ['TODOS', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  public readonly matchdaysList: Array<number | 'TODOS'> = ['TODOS', 1, 2, 3];

  constructor() {
    // Temporal verification of reactive data arrival
    effect(() => {
      console.log('[Dashboard] Current user profile loaded:', this.authService.profile());
    });
  }

  // Profile display helpers
  get username(): string {
    return this.authService.profile()?.username || 'Usuario';
  }

  get roleLabel(): string {
    return this.authService.profile()?.role === 'admin'
      ? 'ADMINISTRADOR'
      : 'PARTICIPANTE';
  }

  // Computed Signal for filter-aware match list
  public readonly filteredMatches = computed(() => {
    let result = this.matchService.matches();
    const group = this.selectedGroup();
    const matchday = this.selectedMatchday();

    if (group !== 'TODOS') {
      result = result.filter(m => m.group_name === group);
    }

    if (matchday !== 'TODOS') {
      result = result.filter(m => m.round === matchday);
    }

    return result;
  });

  // Check if there are queued offline forecasts in local storage
  public readonly hasOfflineQueue = computed(() => {
    // Simply check for active items in local queue
    try {
      const queue = JSON.parse(localStorage.getItem('offline_prediction_queue') || '[]');
      return queue.length > 0;
    } catch {
      return false;
    }
  });

  // Calculate percentage of hits based on user predicted & finished matches
  public readonly hitRate = computed(() => {
    const preds = this.predictionService.predictions();
    const matches = this.matchService.matches();
    
    const finishedWithPreds = matches.filter(m => m.status === 'finished' && preds[m.id]);
    if (finishedWithPreds.length === 0) return 0;

    const correct = finishedWithPreds.filter(m => m.result && preds[m.id].prediction === m.result).length;
    return Math.round((correct / finishedWithPreds.length) * 100);
  });

  /**
   * Resolves first two letters of username as elegant initials fallback.
   */
  public getUserInitials(): string {
    const profile = this.authService.profile();
    if (!profile || !profile.username) return '⚽';
    const parts = profile.username.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    const name = profile.username.trim();
    if (name.length <= 2) return name.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  /**
   * Fires selection to predictions service.
   */
  public async onPredictionSelected(event: { matchId: string; selection: PredictionType }): Promise<void> {
    const res = await this.predictionService.setPrediction(event.matchId, event.selection);
    if (!res.success) {
      alert(res.message);
    }
  }

  /**
   * Triggers manual offline queue upload.
   */
  public async syncOfflineData(): Promise<void> {
    await this.predictionService.syncOfflinePredictions();
    await this.leaderboardService.fetchLeaderboard();
  }

  /**
   * Scrolls smoothly to the leaderboard section (Mobile UX).
   */
  public scrollToLeaderboard(): void {
    const el = document.getElementById('leaderboard-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Fires sign out stream.
   */
  public async onLogout(): Promise<void> {
    if (confirm('¿Deseas cerrar tu sesión actual?')) {
      await this.authService.signOut();
      this.router.navigate(['/auth']);
    }
  }
}
