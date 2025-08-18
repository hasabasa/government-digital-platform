import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginCredentials, LoginResponse } from '../types';
import apiService from '../services/api.service';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithECP: (certificateData: any) => Promise<void>;
  loginWithEGovMobile: (sessionId: string) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response: LoginResponse = await apiService.login(credentials);
          set({ 
            user: response.user, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Login failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      loginWithECP: async (certificateData: any) => {
        set({ isLoading: true, error: null });
        
        try {
          const response: LoginResponse = await apiService.loginWithECP(certificateData);
          set({ 
            user: response.user, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'ECP login failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      loginWithEGovMobile: async (sessionId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response: LoginResponse = await apiService.loginWithEGovMobile(sessionId);
          set({ 
            user: response.user, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'eGov Mobile login failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          await apiService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null
          });
        }
      },

      getCurrentUser: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const user = await apiService.getCurrentUser();
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to get user', 
            isLoading: false,
            isAuthenticated: false
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
      
      setUser: (user: User) => set({ user, isAuthenticated: true }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
