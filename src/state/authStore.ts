import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  avatarUrl?: string;
};

type StoredUser = UserProfile & { password: string };

type AuthState = {
  usersByEmail: Record<string, StoredUser>;
  currentUserEmail: string | null;
  // selectors
  getCurrentUser: () => UserProfile | null;
  getAllUsers: () => UserProfile[];
  // actions
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    phone: string;
  }) => Promise<UserProfile>;
  login: (email: string, password: string) => Promise<UserProfile>;
  logout: () => void;
  updateAvatar: (avatarUrl: string) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      usersByEmail: {},
      currentUserEmail: null,
      getCurrentUser: () => {
        const { usersByEmail, currentUserEmail } = get();
        if (!currentUserEmail) return null;
        const u = usersByEmail[currentUserEmail];
        if (!u) return null;
        const { password, ...profile } = u;
        return profile;
      },
      register: async ({ name, email, password, role, phone }) => {
        const { usersByEmail } = get();
        const normalized = email.trim().toLowerCase();
        if (usersByEmail[normalized]) {
          throw new Error("E-mail já cadastrado");
        }
        const id = crypto.randomUUID();
        const newUser: StoredUser = {
          id,
          name: name.trim(),
          email: normalized,
          role: role.trim(),
          phone: phone.trim(),
          avatarUrl: undefined,
          password,
        };
        set((state) => ({
          usersByEmail: { ...state.usersByEmail, [normalized]: newUser },
          currentUserEmail: normalized,
        }));
        const { password: _, ...profile } = newUser;
        return profile;
      },
      login: async (email, password) => {
        const { usersByEmail } = get();
        const normalized = email.trim().toLowerCase();
        const user = usersByEmail[normalized];
        if (!user || user.password !== password) {
          throw new Error("Credenciais inválidas");
        }
        set({ currentUserEmail: normalized });
        const { password: _, ...profile } = user;
        return profile;
      },
      logout: () => set({ currentUserEmail: null }),
      updateAvatar: (avatarUrl: string) => {
        const { currentUserEmail, usersByEmail } = get();
        if (!currentUserEmail) return;
        const current = usersByEmail[currentUserEmail];
        if (!current) return;
        const updated: StoredUser = { ...current, avatarUrl };
        set({ usersByEmail: { ...usersByEmail, [currentUserEmail]: updated } });
      },
      getAllUsers: () => {
        const { usersByEmail } = get();
        return Object.values(usersByEmail).map(({ password, ...user }) => user);
      },
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        usersByEmail: state.usersByEmail,
        currentUserEmail: state.currentUserEmail,
      }),
    }
  )
);

export function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
