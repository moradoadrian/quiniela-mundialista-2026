import { Injectable, signal, computed, inject, NgZone } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Profile } from '../models/profile.interface';
import { Session, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  // Private Writable Signals representing central state
  private readonly _session = signal<Session | null>(null);
  public readonly profile = signal<Profile | null>(null);
  private readonly _isLoading = signal<boolean>(true);

  // Public Read-Only Signals (Derived State exactly matching requirements)
  public readonly session = computed(() => this._session());
  public readonly user = computed(() => this._session()?.user || null);
  
  public readonly isAuthenticated = computed(() => !!this._session());
  public readonly isLoading = computed(() => this._isLoading());
  
  // Quick role check helper
  public readonly isAdmin = computed(() => this.profile()?.role === 'admin');

  // Initialization promise for router guard synchronization
  private initPromiseResolve!: (value: boolean) => void;
  private readonly initPromise = new Promise<boolean>((resolve) => {
    this.initPromiseResolve = resolve;
  });

  // Demo Fallback configuration (Runs if Supabase is unconfigured or offline)
  private readonly isDemoMode = computed(() => {
    return environment.supabaseUrl.includes('your-supabase-project');
  });

  constructor() {
    this.initializeAuth();
  }

  /**
   * Returns a promise that resolves when initial session verification is complete.
   */
  public initialized(): Promise<boolean> {
    return this.initPromise;
  }

  /**
   * Initializes session recovery, checks URL hash fragments, and listens to changes.
   */
  private async initializeAuth(): Promise<void> {
    this._isLoading.set(true);

    if (this.isDemoMode()) {
      this.initializeDemoAuth();
      this.initPromiseResolve(true);
      return;
    }

    try {
      // 1. Detect if returning from OAuth redirect with token in Hash
      const hasOAuthHash = typeof window !== 'undefined' && 
                           window.location.hash && 
                           (window.location.hash.includes('access_token=') || window.location.hash.includes('error='));

      // 2. Fetch initial session (reads localStorage / retrieves active cookies)
      const { data: { session } } = await this.supabaseService.client.auth.getSession();
      
      if (session) {
        this._session.set(session);
        await this.loadProfile(session.user.id);
      }

      // 3. Listen to auth changes (this is where the redirect hash is processed asynchronously)
      this.supabaseService.client.auth.onAuthStateChange((event, currentSession) => {
        this.ngZone.run(async () => {
          this._session.set(currentSession);
          
          if (currentSession) {
            await this.loadProfile(currentSession.user.id);
            
            // Auto redirect to dashboard if user is currently on the login/auth page
            if (this.router.url === '/auth' || this.router.url.includes('/auth#')) {
              this.router.navigate(['/dashboard']);
            }
          } else {
            this.profile.set(null);
          }

          // De-escalate loading once the session resolves
          this._isLoading.set(false);
          this.initPromiseResolve(true);
        });
      });

      // If we don't have an active session and we are NOT in an OAuth redirect flow,
      // we can immediately release the initialization barrier.
      if (!session && !hasOAuthHash) {
        this._isLoading.set(false);
        this.initPromiseResolve(true);
      }
    } catch (err) {
      console.error('Supabase Auth Initialization failed, switching to Demo Mode', err);
      this.initializeDemoAuth();
      this.initPromiseResolve(true);
    }
  }

  /**
   * Queries the 'profiles' PostgreSQL table for the authenticated user's profile metadata.
   * 
   * @param userId UUID of the user profile to fetch.
   * @returns Resolves the user profile object or null.
   */
  public async loadProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      console.log('SESSION', this._session());
      console.log('PROFILE DB', data);

      if (data) {
        this.profile.set(data as Profile);
        console.log('PROFILE SIGNAL', this.profile());
        return data as Profile;
      }
      return null;
    } catch (err) {
      console.error('Error fetching user profile from database:', err);
      return null;
    }
  }

  /**
   * Google OAuth login trigger.
   */
  public async signInWithGoogle(): Promise<void> {
    if (this.isDemoMode()) {
      this.simulateDemoSignIn('google@copa.com', 'adminpass', 'admin');
      this.router.navigate(['/dashboard']);
      return;
    }

    try {
      const { error } = await this.supabaseService.client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard'
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google OAuth trigger failed', err);
    }
  }

  /**
   * Email/Password sign in.
   */
  public async signInWithEmail(email: string, password: string): Promise<{ success: boolean; message: string }> {
    this._isLoading.set(true);

    if (this.isDemoMode()) {
      const res = this.simulateDemoSignIn(email, password);
      this._isLoading.set(false);
      return res;
    }

    try {
      const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      if (data.session) {
        this._session.set(data.session);
        await this.loadProfile(data.session.user.id);
      }

      this._isLoading.set(false);
      return { success: true, message: 'Sesión iniciada con éxito.' };
    } catch (err: any) {
      this._isLoading.set(false);
      return { success: false, message: err.message || 'Error al iniciar sesión' };
    }
  }

  /**
   * Sign up.
   */
  public async signUpWithEmail(email: string, password: string, username: string, avatarUrl?: string): Promise<{ success: boolean; message: string }> {
    this._isLoading.set(true);

    if (this.isDemoMode()) {
      this._isLoading.set(false);
      return { success: true, message: 'Cuenta de prueba simulada registrada.' };
    }

    try {
      const { error } = await this.supabaseService.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            avatar_url: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            role: 'user'
          }
        }
      });

      this._isLoading.set(false);
      if (error) throw error;
      return { success: true, message: 'Registro exitoso. Revisa tu email para confirmación.' };
    } catch (err: any) {
      this._isLoading.set(false);
      return { success: false, message: err.message || 'Error en el registro' };
    }
  }

  /**
   * Destroys active session, clears Signals, and redirects to /auth.
   */
  public async signOut(): Promise<void> {
    this._isLoading.set(true);
    
    if (this.isDemoMode()) {
      localStorage.removeItem('demo_auth_session');
      this._session.set(null);
      this.profile.set(null);
      this._isLoading.set(false);
      this.router.navigate(['/auth']);
      return;
    }

    try {
      await this.supabaseService.client.auth.signOut();
    } catch (err) {
      console.error('Sign Out failed', err);
    } finally {
      this._session.set(null);
      this.profile.set(null);
      this._isLoading.set(false);
      this.router.navigate(['/auth']);
    }
  }

  // ==========================================
  // OFFLINE DEMO AUTH STATE SIMULATION
  // ==========================================
  
  private initializeDemoAuth(): void {
    const cached = localStorage.getItem('demo_auth_session');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        this._session.set(parsed.session);
        this.profile.set(parsed.profile);
      } catch {
        localStorage.removeItem('demo_auth_session');
      }
    }
    this._isLoading.set(false);
  }

  private simulateDemoSignIn(email: string, password: string, forceRole?: 'user' | 'admin'): { success: boolean; message: string } {
    const role = forceRole || (email.toLowerCase().includes('admin') ? 'admin' : 'user');
    const username = email.split('@')[0];
    const avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
    
    const mockSession = {
      access_token: 'demo-token-xyz',
      token_type: 'bearer',
      expires_in: 3600,
      user: {
        id: role === 'admin' ? 'demo-admin-uuid' : 'demo-user-uuid',
        email,
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: { username, avatar_url: avatar }
      }
    } as unknown as Session;

    const mockProfile: Profile = {
      id: role === 'admin' ? 'demo-admin-uuid' : 'demo-user-uuid',
      username: username || (role === 'admin' ? 'Administrador Copa' : 'Usuario Predictor'),
      avatar_url: avatar || (role === 'admin' 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' 
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'),
      role,
      created_at: new Date().toISOString()
    };

    const sessionState = { session: mockSession, profile: mockProfile };
    localStorage.setItem('demo_auth_session', JSON.stringify(sessionState));

    this._session.set(mockSession);
    this.profile.set(mockProfile);
    
    return { success: true, message: 'Inicio de sesión simulado en Demo.' };
  }
}
