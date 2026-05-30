import { Component, Input, computed, signal } from '@angular/core';

@Component({
  selector: 'app-dashboard-stats',
  standalone: true,
  imports: [],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch mb-8">
      
      <!-- Card 1: Progress Tracker -->
      <div class="backdrop-blur-md bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-xl">
        <div class="absolute -right-16 -top-16 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div class="relative z-10 space-y-4">
          <div class="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            <span>Tu Progreso</span>
            <span class="bg-blue-500/15 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-mono">
              {{ completedCount }} / {{ totalCount }} Partidos
            </span>
          </div>

          <div class="space-y-2">
            <h4 class="text-2xl font-black text-slate-100 font-mono tracking-tight">{{ percentage }}%</h4>
            <div class="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900 shadow-inner">
              <div 
                class="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-550 ease-out"
                [style.width.%]="percentage"
              ></div>
            </div>
          </div>

          <div class="flex justify-between items-center text-[10px] text-slate-500 font-medium pt-1">
            <span>Quedan {{ totalCount - completedCount }} partidos</span>
            <span>Meta: 72 Partidos</span>
          </div>
        </div>
      </div>

      <!-- Card 2: Live Points & Stats -->
      <div class="backdrop-blur-md bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-xl">
        <div class="absolute -right-16 -top-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div class="relative z-10 space-y-4">
          <div class="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            <span>Puntos y Rendimiento</span>
            <span class="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Puntaje General
            </span>
          </div>

          <div class="flex items-baseline gap-2">
            <h4 class="text-4xl font-black text-slate-50 font-mono tracking-tight">{{ score }}</h4>
            <span class="text-xs text-slate-400 font-bold uppercase tracking-wider">Puntos Reales</span>
          </div>

          <p class="text-[10px] text-slate-500 leading-relaxed font-medium">
            Se otorga 1 punto por atinar correctamente la opción L, E o V en partidos finalizados.
          </p>
        </div>
      </div>

      <!-- Card 3: Streaks and Gamification Badges -->
      <div class="backdrop-blur-md bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-xl">
        <div class="absolute -right-16 -top-16 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div class="relative z-10 space-y-4">
          <div class="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            <span>Rachas y Logros</span>
            <span class="bg-rose-500/15 text-rose-450 border border-rose-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
              🔥 Racha
            </span>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="bg-slate-950/60 border border-slate-850 p-2.5 rounded-xl text-center shadow-inner">
              <span class="text-[9px] text-slate-500 uppercase font-bold block mb-1">Racha Activa</span>
              <strong class="text-lg font-black font-mono text-rose-400">
                {{ streak.currentStreak }}
              </strong>
            </div>
            <div class="bg-slate-950/60 border border-slate-850 p-2.5 rounded-xl text-center shadow-inner">
              <span class="text-[9px] text-slate-500 uppercase font-bold block mb-1">Racha Máxima</span>
              <strong class="text-lg font-black font-mono text-amber-500">
                {{ streak.maxStreak }}
              </strong>
            </div>
          </div>

          <!-- Dynamic Badges -->
          <div class="flex flex-wrap gap-1.5 pt-1">
            @for (badge of activeBadges(); track badge.name) {
              <span 
                [class]="badge.classes"
                class="text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm border"
                [title]="badge.description"
              >
                {{ badge.icon }} {{ badge.name }}
              </span>
            } @empty {
              <span class="text-[9px] text-slate-500 font-medium">Realiza tu primer pronóstico para ganar medallas.</span>
            }
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class DashboardStatsComponent {
  private readonly _completedCount = signal<number>(0);
  private readonly _totalCount = signal<number>(72);
  private readonly _percentage = signal<number>(0);
  private readonly _score = signal<number>(0);
  private readonly _streak = signal<{ currentStreak: number; maxStreak: number }>({ currentStreak: 0, maxStreak: 0 });

  @Input({ required: true }) set completedCount(val: number) { this._completedCount.set(val); }
  get completedCount(): number { return this._completedCount(); }

  @Input({ required: true }) set totalCount(val: number) { this._totalCount.set(val); }
  get totalCount(): number { return this._totalCount(); }

  @Input({ required: true }) set percentage(val: number) { this._percentage.set(val); }
  get percentage(): number { return this._percentage(); }

  @Input({ required: true }) set score(val: number) { this._score.set(val); }
  get score(): number { return this._score(); }

  @Input({ required: true }) set streak(val: { currentStreak: number; maxStreak: number }) { this._streak.set(val); }
  get streak(): { currentStreak: number; maxStreak: number } { return this._streak(); }

  // Calculate dynamic gamification achievements/badges
  public readonly activeBadges = computed(() => {
    const list: Array<{ name: string; icon: string; classes: string; description: string }> = [];
    const completed = this._completedCount();
    const currentStreak = this._streak().currentStreak;
    const maxStreak = this._streak().maxStreak;
    const scoreVal = this._score();

    if (completed > 0) {
      list.push({
        name: 'Novato',
        icon: '🌱',
        classes: 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20',
        description: 'Has realizado al menos un pronóstico en la quiniela.'
      });
    }

    if (completed >= 36) {
      list.push({
        name: 'Estratega',
        icon: '🧠',
        classes: 'bg-blue-500/10 text-blue-450 border-blue-500/20',
        description: 'Has completado más de la mitad de la quiniela.'
      });
    }

    if (completed === 72) {
      list.push({
        name: 'Completista',
        icon: '👑',
        classes: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        description: '¡Has completado las predicciones de los 72 partidos de grupos!'
      });
    }

    if (currentStreak >= 3) {
      list.push({
        name: 'En Fuego',
        icon: '🔥',
        classes: 'bg-rose-500/10 text-rose-450 border-rose-500/20 animate-pulse',
        description: '¡Racha activa de 3 o más aciertos seguidos!'
      });
    }

    if (scoreVal >= 5) {
      list.push({
        name: 'Cazador',
        icon: '🎯',
        classes: 'bg-purple-500/10 text-purple-450 border-purple-500/20',
        description: 'Has acertado 5 o más partidos oficiales del mundial.'
      });
    }

    return list;
  });
}
