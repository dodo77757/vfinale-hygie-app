import React, { createContext, useContext, useState, ReactNode } from 'react';

// On laisse Cursor définir le vrai type UserProfile plus tard
type UserProfile = any; 

interface ClientContextType {
  clients: UserProfile[];
  currentProfile: UserProfile | null;
  setClients: (clients: UserProfile[]) => void;
  setCurrentProfile: (profile: UserProfile | null) => void;
  updateProfile: (updatedProfile: UserProfile) => void;
  addClient: (newClient: UserProfile) => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider = ({ children }: { children: ReactNode }) => {
  // On déplace les états ici
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);

  const updateProfile = (updatedProfile: UserProfile) => {
    setCurrentProfile(updatedProfile);
    setClients(prev => prev.map(c => c.id === updatedProfile.id ? updatedProfile : c));
  };

  const addClient = (newClient: UserProfile) => {
    setClients(prev => [...prev, newClient]);
    setCurrentProfile(newClient);
  };

  const value = {
    clients,
    currentProfile,
    setClients,
    setCurrentProfile,
    updateProfile,
    addClient
  };

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
};

export const useClient = () => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient doit être utilisé dans un ClientProvider');
  }
  return context;
};