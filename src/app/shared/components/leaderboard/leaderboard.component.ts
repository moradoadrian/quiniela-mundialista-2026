import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { LeaderboardUserEntry } from '../../../core/models/supabase.models';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="backdrop-blur-md bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-xl">
      <!-- Title Header -->
      <div class="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-4">
        <div>
          <h3 class="text-sm font-extrabold text-slate-100 flex items-center gap-2 tracking-wide">
            🏆 Tabla de Posiciones
          </h3>
          <p class="text-[10px] text-slate-500 font-medium">Actualizaciones en Tiempo Real</p>
        </div>
        <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2.5 py-1 rounded-full font-extrabold uppercase">
          En Vivo
        </span>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="text-slate-500 text-[9px] font-extrabold tracking-widest uppercase border-b border-slate-800 pb-2">
              <th class="py-2.5 px-2 text-center w-12">Pos</th>
              <th class="py-2.5 px-3">Participante</th>
              <th class="py-2.5 px-3 text-center hidden sm:table-cell">Predichos</th>
              <th class="py-2.5 px-3 text-right pr-4">Pts</th>
            </tr>
          </thead>
          <tbody>
            @for (entry of entries; track entry.userId) {
              <tr 
                class="border-b border-slate-800/40 hover:bg-slate-800/20 transition-all duration-150 rounded-xl"
                [ngClass]="{
                  'bg-emerald-500/5 border-l-4 border-l-emerald-500 font-semibold text-emerald-50 hover:bg-emerald-500/10': isCurrentUser(entry.userId)
                }"
              >
                <!-- Rank -->
                <td class="py-3 px-2 text-center">
                  <div class="flex items-center justify-center">
                    @if (entry.rank === 1) {
                      <span class="flex items-center justify-center w-5.5 h-5.5 rounded-full bg-yellow-500 text-slate-950 text-[10px] font-extrabold shadow-md shadow-yellow-500/20">🥇</span>
                    } @else if (entry.rank === 2) {
                      <span class="flex items-center justify-center w-5.5 h-5.5 rounded-full bg-slate-300 text-slate-950 text-[10px] font-extrabold shadow-md shadow-slate-300/20">🥈</span>
                    } @else if (entry.rank === 3) {
                      <span class="flex items-center justify-center w-5.5 h-5.5 rounded-full bg-amber-700 text-amber-50 text-[10px] font-extrabold shadow-md shadow-amber-900/20">🥉</span>
                    } @else {
                      <span class="text-xs font-bold text-slate-500 font-mono">{{ entry.rank }}</span>
                    }
                  </div>
                </td>

                <!-- Participant -->
                <td class="py-3 px-3">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <img 
                      [src]="entry.avatarUrl" 
                      [alt]="entry.userName"
                      class="w-7 h-7 rounded-full object-cover border border-slate-700 shadow-sm"
                      loading="lazy"
                    />
                    <div class="flex flex-col min-w-0">
                      <span class="text-xs font-bold text-slate-200 truncate flex items-center gap-1">
                        {{ entry.userName }}
                        @if (isCurrentUser(entry.userId)) {
                          <span class="bg-emerald-500 text-slate-950 text-[8px] px-1 py-0.2 rounded font-black tracking-wider uppercase">TÚ</span>
                        }
                      </span>
                      @if (entry.role === 'admin') {
                        <span class="text-[8px] text-red-400 font-bold uppercase tracking-wider">Admin</span>
                      } @else {
                        <span class="text-[8px] text-slate-500">Participante</span>
                      }
                    </div>
                  </div>
                </td>

                <!-- Predicted -->
                <td class="py-3 px-3 text-center hidden sm:table-cell">
                  <span class="text-[10px] bg-slate-950/70 border border-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
                    {{ entry.totalPredicted }}/72
                  </span>
                </td>

                <!-- Points -->
                <td class="py-3 px-3 text-right pr-4">
                  <div class="flex flex-col items-end">
                    <span class="text-sm font-extrabold text-slate-100 font-mono">
                      {{ entry.points }}
                    </span>
                    <span class="text-[8px] text-slate-500 sm:hidden">
                      {{ entry.totalPredicted }} pred.
                    </span>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="text-center py-8 text-xs text-slate-500">
                  Cargando posiciones en tiempo real...
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class LeaderboardComponent {
  @Input({ required: true }) entries: LeaderboardUserEntry[] = [];
  @Input({ required: true }) currentUserId: string = '';

  public isCurrentUser(id: string): boolean {
    return id === this.currentUserId;
  }
}
