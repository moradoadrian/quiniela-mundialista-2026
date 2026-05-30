import { Component, Input, Output, EventEmitter, computed, signal, OnInit, OnDestroy, NgZone, inject, ChangeDetectorRef } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { MatchWithTeams, DbPrediction, PredictionType } from '../../../core/models/supabase.models';

@Component({
  selector: 'app-match-card',
  standalone: true,
  imports: [NgClass, DatePipe],
  template: `
    <div 
      class="backdrop-blur-md bg-slate-900/60 border rounded-2xl p-4 transition-all duration-300 shadow-lg hover:shadow-2xl flex flex-col justify-between h-full group"
      [ngClass]="{
        'border-slate-800/80 hover:border-slate-700': !match.result && !isLocked(),
        'border-emerald-500/30 bg-emerald-950/5 hover:border-emerald-500/50': isPredictionCorrect(),
        'border-rose-500/30 bg-rose-950/5 hover:border-rose-500/50': isPredictionIncorrect(),
        'border-slate-800/90 bg-slate-950/40 opacity-90': isLocked() && !match.result
      }"
    >
      <!-- Match Header -->
      <div class="flex items-center justify-between text-[10px] text-slate-400 mb-3 border-b border-slate-800/60 pb-2">
        <span class="font-extrabold tracking-widest text-emerald-400 uppercase">GRUPO {{ match.group_name }}</span>
        
        <div class="flex items-center gap-1.5">
          @if (match.status === 'finished') {
            <span class="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded font-extrabold uppercase">Finalizado</span>
          } @else if (isLocked()) {
            <span class="bg-slate-850 text-slate-400 border border-slate-800 px-2 py-0.5 rounded font-bold flex items-center gap-1">
              🔒 Cerrado
            </span>
          } @else {
            <span class="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-extrabold flex items-center gap-1 animate-pulse">
              🟢 Activo
            </span>
          }
          <span class="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono font-medium">J{{ match.round }}</span>
        </div>
      </div>

      <!-- Core Content: Teams and Score -->
      <div class="grid grid-cols-7 items-center gap-1.5 my-3 flex-grow">
        <!-- Home Team -->
        <div class="col-span-2 flex flex-col items-center text-center">
          <div class="relative">
            <img 
              [src]="match.homeTeam.flag_url" 
              [alt]="match.homeTeam.name" 
              class="w-12 h-8 object-cover rounded shadow-md border border-slate-800 group-hover:scale-105 transition-transform duration-250"
              loading="lazy"
            />
          </div>
          <span class="text-xs font-bold text-slate-100 mt-2 truncate w-full" [title]="match.homeTeam.name">
            {{ match.homeTeam.name }}
          </span>
          <span class="text-[10px] text-slate-500 font-mono font-semibold">{{ match.homeTeam.code }}</span>
        </div>

        <!-- Scores / VS Column -->
        <div class="col-span-3 flex flex-col items-center justify-center">
          @if (match.status === 'finished' && match.home_score !== undefined) {
            <div class="flex items-center gap-2.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl shadow-inner">
              <span class="text-xl font-extrabold text-slate-50 font-mono">{{ match.home_score }}</span>
              <span class="text-xs text-slate-600 font-extrabold">-</span>
              <span class="text-xl font-extrabold text-slate-50 font-mono">{{ match.away_score }}</span>
            </div>
            <span class="text-[9px] text-amber-500/90 font-extrabold tracking-wider uppercase mt-1.5">Marcador Oficial</span>
          } @else {
            <div class="text-[10px] font-extrabold text-slate-400 tracking-wider bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-850">
              VS
            </div>
            <!-- Time Countdown display -->
            <span class="text-[9px] mt-1.5 font-mono text-slate-400" [ngClass]="{'text-rose-400': isLocked()}">
              @if (isLocked()) {
                Comenzó el {{ match.match_date | date: 'dd/MM HH:mm' }}
              } @else {
                {{ countdownText() }}
              }
            </span>
          }
        </div>

        <!-- Away Team -->
        <div class="col-span-2 flex flex-col items-center text-center">
          <div class="relative">
            <img 
              [src]="match.awayTeam.flag_url" 
              [alt]="match.awayTeam.name" 
              class="w-12 h-8 object-cover rounded shadow-md border border-slate-800 group-hover:scale-105 transition-transform duration-250"
              loading="lazy"
            />
          </div>
          <span class="text-xs font-bold text-slate-100 mt-2 truncate w-full" [title]="match.awayTeam.name">
            {{ match.awayTeam.name }}
          </span>
          <span class="text-[10px] text-slate-500 font-mono font-semibold">{{ match.awayTeam.code }}</span>
        </div>
      </div>

      <!-- Venue details -->
      <div class="text-[9px] text-slate-500 text-center font-medium my-1.5 truncate border-t border-slate-850 pt-2 pb-1.5">
        🏟️ {{ match.stadium }}
      </div>

      <!-- Action Button Panel (L-E-V) -->
      <div class="flex flex-col gap-2 mt-auto">
        <div class="grid grid-cols-3 gap-2">
          <!-- Button L (Local) -->
          <button 
            type="button"
            [disabled]="isLocked()"
            (click)="selectPrediction('L')"
            class="py-2 rounded-xl text-[11px] font-extrabold tracking-wider transition-all duration-200 border flex flex-col items-center justify-center gap-0.5 select-none"
            [ngClass]="{
              'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-900/40 scale-[1.02]': activeSelection() === 'L',
              'bg-slate-950 border-slate-850 text-slate-450 hover:bg-slate-850 hover:text-white hover:border-slate-700': activeSelection() !== 'L' && !isLocked(),
              'bg-slate-900/40 border-slate-900 text-slate-600 cursor-not-allowed': isLocked() && activeSelection() !== 'L'
            }"
          >
            <span>L</span>
            <span class="text-[8px] opacity-75 font-medium">Local</span>
          </button>

          <!-- Button E (Draw) -->
          <button 
            type="button"
            [disabled]="isLocked()"
            (click)="selectPrediction('E')"
            class="py-2 rounded-xl text-[11px] font-extrabold tracking-wider transition-all duration-200 border flex flex-col items-center justify-center gap-0.5 select-none"
            [ngClass]="{
              'bg-slate-600 border-slate-500 text-white shadow-md shadow-slate-950/40 scale-[1.02]': activeSelection() === 'E',
              'bg-slate-950 border-slate-850 text-slate-450 hover:bg-slate-850 hover:text-white hover:border-slate-700': activeSelection() !== 'E' && !isLocked(),
              'bg-slate-900/40 border-slate-900 text-slate-600 cursor-not-allowed': isLocked() && activeSelection() !== 'E'
            }"
          >
            <span>E</span>
            <span class="text-[8px] opacity-75 font-medium">Empate</span>
          </button>

          <!-- Button V (Visitor) -->
          <button 
            type="button"
            [disabled]="isLocked()"
            (click)="selectPrediction('V')"
            class="py-2 rounded-xl text-[11px] font-extrabold tracking-wider transition-all duration-200 border flex flex-col items-center justify-center gap-0.5 select-none"
            [ngClass]="{
              'bg-red-600 border-red-500 text-white shadow-md shadow-red-900/40 scale-[1.02]': activeSelection() === 'V',
              'bg-slate-950 border-slate-850 text-slate-450 hover:bg-slate-850 hover:text-white hover:border-slate-700': activeSelection() !== 'V' && !isLocked(),
              'bg-slate-900/40 border-slate-900 text-slate-600 cursor-not-allowed': isLocked() && activeSelection() !== 'V'
            }"
          >
            <span>V</span>
            <span class="text-[8px] opacity-75 font-medium">Visita</span>
          </button>
        </div>

        <!-- Result Outcome Labels -->
        @if (match.status === 'finished') {
          <div class="mt-2 text-center text-[10px] font-bold py-1.5 rounded-lg border">
            @if (isPredictionCorrect()) {
              <div class="text-emerald-400 bg-emerald-950/20 border-emerald-500/20 flex items-center justify-center gap-1">
                <span>✓</span> Acertado (+1 punto)
              </div>
            } @else if (!activeSelection()) {
              <div class="text-slate-500 bg-slate-950/20 border-slate-900/20 flex items-center justify-center gap-1">
                <span>-</span> Sin pronóstico (0 puntos)
              </div>
            } @else {
              <div class="text-rose-450 bg-rose-950/20 border-rose-500/20 flex items-center justify-center gap-1">
                <span>✗</span> Fallado (Resultado: {{ match.result }} - 0 puntos)
              </div>
            }
          </div>
        } @else if (isLocked()) {
          <div class="mt-2 text-center text-[9px] font-bold py-1 rounded-lg bg-slate-950/60 border border-slate-850 text-slate-500 flex items-center justify-center gap-1.5">
            🔒 Predicción bloqueada para este encuentro
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class MatchCardComponent implements OnInit, OnDestroy {
  private readonly _match = signal<MatchWithTeams | null>(null);
  private readonly _prediction = signal<DbPrediction | null>(null);

  @Input({ required: true }) set match(value: MatchWithTeams) {
    this._match.set(value);
  }
  get match(): MatchWithTeams {
    return this._match()!;
  }

  @Input() set prediction(value: DbPrediction | null) {
    this._prediction.set(value);
  }
  get prediction(): DbPrediction | null {
    return this._prediction();
  }

  @Output() predictionSelected = new EventEmitter<PredictionType>();

  // Countdown writable state
  public readonly countdownText = signal<string>('');
  
  // Real-time lock signal
  private readonly _currentTime = signal<number>(Date.now());
  
  public readonly isLocked = computed(() => {
    const m = this._match();
    if (!m) return true;
    return new Date(m.match_date).getTime() <= this._currentTime() || 
           m.status === 'closed' || 
           m.status === 'finished';
  });

  public readonly activeSelection = computed(() => {
    const pred = this._prediction();
    return pred ? pred.prediction : null;
  });

  private countdownInterval: any;
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.updateCountdown();
    this.ngZone.runOutsideAngular(() => {
      this.countdownInterval = setInterval(() => {
        this._currentTime.set(Date.now());
        this.updateCountdown();
        this.cdr.detectChanges();
      }, 60000); // Update every minute
    });
  }

  /**
   * Fires the selection event upward if match is active.
   */
  public selectPrediction(prediction: PredictionType): void {
    if (!this.isLocked()) {
      this.predictionSelected.emit(prediction);
    }
  }

  /**
   * Evaluates if prediction was correct.
   */
  public isPredictionCorrect(): boolean {
    return this.match.status === 'finished' && 
           this.activeSelection() !== null && 
           this.activeSelection() === this.match.result;
  }

  /**
   * Evaluates if prediction was incorrect.
   */
  public isPredictionIncorrect(): boolean {
    return this.match.status === 'finished' && 
           this.activeSelection() !== null && 
           this.activeSelection() !== this.match.result;
  }

  /**
   * Refreshes dynamic kickoff countdown texts.
   */
  private updateCountdown(): void {
    const target = new Date(this.match.match_date).getTime();
    const diff = target - Date.now();

    if (diff <= 0) {
      this.countdownText.set('Comenzado');
      return;
    }

    const hrs = Math.floor(diff / 3600000);
    if (hrs >= 48) {
      const days = Math.floor(hrs / 24);
      this.countdownText.set(`Faltan ${days} días`);
    } else if (hrs >= 1) {
      this.countdownText.set(`Faltan ${hrs} horas`);
    } else {
      const mins = Math.floor((diff % 3600000) / 60000);
      this.countdownText.set(`Faltan ${mins} min`);
    }
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
