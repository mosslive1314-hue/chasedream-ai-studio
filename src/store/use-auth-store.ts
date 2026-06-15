/**
 * Local authentication store — replaces @eazo/sdk auth.
 *
 * In development, provides a mock authenticated user.
 * In production, this store should be connected to your
 * actual auth provider (e.g. Auth0, Clerk, Supabase Auth, etc.).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type User = {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  authenticated: boolean;

  // Actions
  login: () => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  bootstrap: () => void;
};

const DEV_USER: User = {
  id: "dev-user-001",
  email: "dev@chasedream.local",
  name: "开发者",
  avatarUrl: null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      authenticated: false,

      login: async () => {
        // Dev mode: instant login with mock user
        // TODO: Replace with real auth provider in production
        set({ loading: true });
        // Simulate a brief login delay
        await new Promise((r) => setTimeout(r, 300));
        set({ user: DEV_USER, authenticated: true, loading: false });
      },

      logout: () => {
        set({ user: null, authenticated: false, loading: false });
      },

      setUser: (user) => {
        set({
          user,
          authenticated: !!user,
          loading: false,
        });
      },

      bootstrap: () => {
        // Dev mode: auto-login with mock user
        // In production, this would check for an existing session
        // (e.g. check cookie, refresh token, etc.)
        set({ user: DEV_USER, authenticated: true, loading: false });
      },
    }),
    {
      name: "chasedream-auth",
      // Only persist user info, not loading state
      partialize: (state) => ({
        user: state.user,
        authenticated: state.authenticated,
      }),
    },
  ),
);
