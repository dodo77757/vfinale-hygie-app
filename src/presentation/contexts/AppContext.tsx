import React, { createContext, useContext, useState, ReactNode } from 'react';

// --- 1. Définition des Types (Le vocabulaire de l'app) ---

// Les différents écrans possibles
export type ViewMode = 'LOGIN' | 'COACH_DASHBOARD' | 'CLIENT_APP';

// Les rôles utilisateurs
export type UserRole = 'COACH' | 'CLIENT' | null;

// Le contrat de notre Contexte (ce qu'il met à disposition)
interface AppContextType {
  viewMode: ViewMode;
  userRole: UserRole;
  navigateTo: (mode: ViewMode) => void;
  loginAs: (role: UserRole) => void;
  logout: () => void;
}

// --- 2. Création du Contexte (La coquille vide) ---
const AppContext = createContext<AppContextType | undefined>(undefined);

// --- 3. Le Provider (Le composant qui diffuse l'info) ---
export const AppProvider = ({ children }: { children: ReactNode }) => {
  // État global de navigation
  const [viewMode, setViewMode] = useState<ViewMode>('LOGIN');
  const [userRole, setUserRole] = useState<UserRole>(null);

  // Fonction pour changer d'écran
  const navigateTo = (mode: ViewMode) => {
    console.log(`Navigation vers : ${mode}`);
    setViewMode(mode);
  };

  // Fonction de connexion (simplifiée pour l'instant)
  const loginAs = (role: UserRole) => {
    setUserRole(role);
    // Redirection automatique selon le rôle
    if (role === 'COACH') setViewMode('COACH_DASHBOARD');
    if (role === 'CLIENT') setViewMode('CLIENT_APP');
  };

  const logout = () => {
    setUserRole(null);
    setViewMode('LOGIN');
  };

  // On regroupe tout dans l'objet "value"
  const value = {
    viewMode,
    userRole,
    navigateTo,
    loginAs,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// --- 4. Le Hook personnalisé (Pour utiliser le contexte facilement) ---
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp doit être utilisé à l\'intérieur d\'un AppProvider');
  }
  return context;
};