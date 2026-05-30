import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    @if (authService.isLoading()) {
      <!-- Full Screen App Boot Loader -->
      <div class="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 space-y-4">
        <div class="relative flex items-center justify-center">
          <!-- Outer Pulsing Ring -->
          <div class="w-16 h-16 border-4 border-emerald-500/20 rounded-full absolute animate-ping"></div>
          <!-- Shimmering Spinner -->
          <div class="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <!-- Ball Icon -->
          <span class="absolute text-xl select-none">⚽</span>
        </div>
        <div class="text-center space-y-1">
          <h3 class="text-xs font-extrabold uppercase tracking-widest text-slate-200">Quiniela Mundialista</h3>
          <p class="text-[9px] text-slate-500 font-mono animate-pulse">Sincronizando credenciales de Supabase...</p>
        </div>
      </div>
    }

    <!-- Main router view (loaded once session is resolved) -->
    <router-outlet></router-outlet>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background-color: #0f172a; /* slate-900 */
    }
  `]
})
export class AppComponent {
  public readonly authService = inject(AuthService);
}
