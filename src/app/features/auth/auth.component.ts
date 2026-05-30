import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [NgClass, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <!-- Decorative Orbs -->
      <div class="absolute top-1/4 -left-36 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-1/4 -right-36 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Centered Card -->
      <div class="w-full max-w-md backdrop-blur-md bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        
        <!-- App Header Logo -->
        <div class="text-center space-y-2">
          <div class="inline-flex bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 text-2xl mb-1 shadow-inner">
            ⚽
          </div>
          <h2 class="text-xl sm:text-2xl font-black text-slate-50 tracking-tight">Quiniela Mundialista 2026</h2>
          <p class="text-xs text-slate-400 font-medium">Predice y compite en vivo en la fase de grupos</p>
        </div>

        <!-- Toggle Sign-In / Sign-Up Tabs -->
        <div class="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
          <button 
            (click)="isRegister.set(false)"
            class="py-2 text-xs font-bold rounded-lg transition-all duration-200"
            [ngClass]="{
              'bg-slate-800 text-white shadow-sm': !isRegister(),
              'text-slate-400 hover:text-white': isRegister()
            }"
          >
            Iniciar Sesión
          </button>
          <button 
            (click)="isRegister.set(true)"
            class="py-2 text-xs font-bold rounded-lg transition-all duration-200"
            [ngClass]="{
              'bg-slate-800 text-white shadow-sm': isRegister(),
              'text-slate-400 hover:text-white': !isRegister()
            }"
          >
            Registrarse
          </button>
        </div>

        <!-- Alert Notification -->
        @if (alertMessage()) {
          <div 
            [ngClass]="alertSuccess() ? 'bg-emerald-950/20 border-emerald-500/35 text-emerald-450' : 'bg-rose-950/20 border-rose-500/35 text-rose-450'"
            class="text-[11px] font-bold p-3 rounded-xl border flex items-center justify-between"
          >
            <span>{{ alertMessage() }}</span>
            <button (click)="alertMessage.set(null)" class="opacity-75 hover:opacity-100 text-xs">✕</button>
          </div>
        }

        <!-- Credentials Form -->
        <form (ngSubmit)="onSubmit()" class="space-y-4">
          @if (isRegister()) {
            <!-- Username Input -->
            <div class="space-y-1.5">
              <label class="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Nombre de Usuario</label>
              <input 
                type="text" 
                name="username" 
                [(ngModel)]="username" 
                required
                placeholder="ej. golazo_10" 
                class="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-3.5 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-semibold"
              />
            </div>

            <!-- Avatar selection -->
            <div class="space-y-1.5">
              <label class="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Elige un Avatar</label>
              <div class="flex gap-2">
                @for (avatar of avatarList; track avatar) {
                  <button 
                    type="button" 
                    (click)="selectedAvatar.set(avatar)"
                    class="w-9 h-9 rounded-full overflow-hidden border-2 transition-all"
                    [ngClass]="selectedAvatar() === avatar ? 'border-emerald-500 scale-105 shadow-md shadow-emerald-500/10' : 'border-slate-800 hover:border-slate-700'"
                  >
                    <img [src]="avatar" alt="Avatar option" class="w-full h-full object-cover" />
                  </button>
                }
              </div>
            </div>
          }

          <!-- Email Input -->
          <div class="space-y-1.5">
            <label class="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Correo Electrónico</label>
            <input 
              type="email" 
              name="email" 
              [(ngModel)]="email" 
              required
              placeholder="correo@ejemplo.com" 
              class="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-3.5 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-semibold"
            />
          </div>

          <!-- Password Input -->
          <div class="space-y-1.5">
            <label class="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Contraseña</label>
            <input 
              type="password" 
              name="password" 
              [(ngModel)]="password" 
              required
              placeholder="••••••••" 
              class="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-3.5 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-semibold"
            />
          </div>

          <!-- Action Button -->
          <button 
            type="submit" 
            [disabled]="authService.isLoading()"
            class="w-full h-11 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-emerald-650/15 hover:shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            @if (authService.isLoading()) {
              <div class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            } @else {
              {{ isRegister() ? 'Crear Cuenta' : 'Iniciar Sesión' }}
            }
          </button>
        </form>

        <!-- Divider -->
        <div class="flex items-center gap-3 my-4">
          <div class="flex-grow h-px bg-slate-800"></div>
          <span class="text-[9px] text-slate-500 font-bold uppercase tracking-wider">O entrar con</span>
          <div class="flex-grow h-px bg-slate-800"></div>
        </div>

        <!-- Google Single Sign-On -->
        <button 
          type="button"
          (click)="loginWithGoogle()"
          [disabled]="authService.isLoading()"
          class="w-full h-11 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.51 0-6.377-2.87-6.377-6.38s2.867-6.38 6.377-6.38c1.62 0 3.097.618 4.226 1.625l3.057-3.057C19.345 2.502 15.992 1 12 1 5.925 1 1 5.925 1 12s4.925 11 11 11c5.73 0 10.285-4.114 10.285-11 0-.693-.06-1.353-.18-1.715H12.24z"/>
          </svg>
          Iniciar sesión con Google
        </button>

        <!-- Sandbox Quick-Logins Info -->
        <div class="bg-slate-950/50 border border-slate-850/80 p-3 rounded-2xl text-[9px] text-slate-500 space-y-1">
          <strong class="text-slate-400 font-bold block">💡 Accesos Rápidos Demo:</strong>
          <span class="block">Correo con palabra "<strong class="text-red-400">admin</strong>" (ej. admin&#64;copa.com) inicia sesión como **Administrador**.</span>
          <span class="block">Cualquier otro correo (ej. tu&#64;copa.com) inicia sesión como **Usuario Predictor**.</span>
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
export class AuthComponent {
  public readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Sign-in controls
  public readonly isRegister = signal<boolean>(false);
  public readonly alertMessage = signal<string | null>(null);
  public readonly alertSuccess = signal<boolean>(false);

  // Form bindings
  public email = '';
  public password = '';
  public username = '';
  
  // Custom avatars catalog
  public readonly avatarList = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
  ];
  public readonly selectedAvatar = signal<string>(this.avatarList[0]);

  /**
   * Triggers form action.
   */
  public async onSubmit(): Promise<void> {
    this.alertMessage.set(null);

    if (!this.email || !this.password) {
      this.alertSuccess.set(false);
      this.alertMessage.set('Por favor completa todos los campos.');
      return;
    }

    if (this.isRegister() && !this.username) {
      this.alertSuccess.set(false);
      this.alertMessage.set('Especifica un nombre de usuario.');
      return;
    }

    let response;
    if (this.isRegister()) {
      response = await this.authService.signUpWithEmail(this.email, this.password, this.username, this.selectedAvatar());
    } else {
      response = await this.authService.signInWithEmail(this.email, this.password);
    }

    if (response.success) {
      this.alertSuccess.set(true);
      this.alertMessage.set(response.message);
      
      // Redirect to Dashboard if logging in
      if (!this.isRegister()) {
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 800);
      } else {
        // Toggle tab to let them sign in
        this.isRegister.set(false);
      }
    } else {
      this.alertSuccess.set(false);
      this.alertMessage.set(response.message);
    }
  }

  /**
   * Fires OAuth stream.
   */
  public async loginWithGoogle(): Promise<void> {
    await this.authService.signInWithGoogle();
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }
}
