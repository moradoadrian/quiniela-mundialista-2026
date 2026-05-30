import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatchWithTeams, DbPrediction, PredictionType } from '../../../core/models/supabase.models';
import { MatchCardComponent } from '../match-card/match-card.component';

@Component({
  selector: 'app-match-list',
  standalone: true,
  imports: [MatchCardComponent],
  template: `
    @if (loading) {
      <!-- Shimmering Loading Skeletons Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (i of [1, 2, 3, 4]; track i) {
          <div class="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between h-48 animate-pulse">
            <!-- Header Skeleton -->
            <div class="flex items-center justify-between border-b border-slate-800/60 pb-2 mb-3">
              <div class="h-3 w-16 bg-slate-800 rounded"></div>
              <div class="h-3 w-10 bg-slate-800 rounded"></div>
            </div>
            
            <!-- Teams Skeleton -->
            <div class="grid grid-cols-7 items-center gap-2 my-2">
              <div class="col-span-2 flex flex-col items-center gap-1.5">
                <div class="w-12 h-8 bg-slate-800 rounded"></div>
                <div class="h-2.5 w-14 bg-slate-800 rounded"></div>
              </div>
              <div class="col-span-3 flex flex-col items-center gap-1.5">
                <div class="w-10 h-7 bg-slate-800 rounded-lg"></div>
                <div class="h-2 w-16 bg-slate-800 rounded"></div>
              </div>
              <div class="col-span-2 flex flex-col items-center gap-1.5">
                <div class="w-12 h-8 bg-slate-800 rounded"></div>
                <div class="h-2.5 w-14 bg-slate-800 rounded"></div>
              </div>
            </div>

            <!-- Footer Buttons Skeleton -->
            <div class="grid grid-cols-3 gap-2 mt-4">
              <div class="h-8 bg-slate-800 rounded-xl"></div>
              <div class="h-8 bg-slate-800 rounded-xl"></div>
              <div class="h-8 bg-slate-800 rounded-xl"></div>
            </div>
          </div>
        }
      </div>
    } @else {
      <!-- Real Matches Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (match of matches; track match.id) {
          <app-match-card
            [match]="match"
            [prediction]="predictions[match.id] || null"
            (predictionSelected)="onPredictionSelected(match.id, $event)"
          ></app-match-card>
        } @empty {
          <!-- Empty State -->
          <div class="col-span-full backdrop-blur-md bg-slate-900/40 border border-slate-800/85 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
            <span class="text-4xl text-slate-500 animate-bounce">📅</span>
            <h4 class="text-sm font-extrabold text-slate-350">No hay partidos en esta categoría</h4>
            <p class="text-xs text-slate-500 max-w-xs leading-relaxed">
              No se encontraron encuentros que coincidan con los filtros seleccionados actualmente. Intenta cambiar de Grupo o Jornada.
            </p>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class MatchListComponent {
  @Input({ required: true }) matches: MatchWithTeams[] = [];
  @Input({ required: true }) predictions: Record<string, DbPrediction> = {};
  @Input({ required: true }) loading: boolean = false;

  @Output() predictionSelected = new EventEmitter<{ matchId: string; selection: PredictionType }>();

  public onPredictionSelected(matchId: string, selection: PredictionType): void {
    this.predictionSelected.emit({ matchId, selection });
  }
}
