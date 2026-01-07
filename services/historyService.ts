import { UserProfile } from '../types';

export interface ModificationHistory {
  id: string;
  clientId: string;
  timestamp: string;
  modifiedBy: string; // 'moderator' | 'system' | 'client'
  field: string;
  oldValue: any;
  newValue: any;
  description: string;
}

const STORAGE_KEY = 'hygie_modification_history';

/**
 * Service pour tracker l'historique des modifications des clients
 */
export const HistoryService = {
  /**
   * Enregistre une modification
   */
  logModification: (
    clientId: string,
    field: string,
    oldValue: any,
    newValue: any,
    description: string,
    modifiedBy: string = 'moderator'
  ): void => {
    const history = HistoryService.getHistory();
    
    const entry: ModificationHistory = {
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clientId,
      timestamp: new Date().toISOString(),
      modifiedBy,
      field,
      oldValue,
      newValue,
      description
    };

    history.push(entry);
    
    // Garder seulement les 1000 dernières modifications
    const trimmedHistory = history.slice(-1000);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
  },

  /**
   * Récupère l'historique d'un client
   */
  getClientHistory: (clientId: string): ModificationHistory[] => {
    const history = HistoryService.getHistory();
    return history
      .filter(h => h.clientId === clientId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  /**
   * Récupère tout l'historique
   */
  getHistory: (): ModificationHistory[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erreur lors de la lecture de l\'historique:', error);
      return [];
    }
  },

  /**
   * Compare deux profils et enregistre les différences
   */
  compareAndLog: (
    oldClient: UserProfile,
    newClient: UserProfile,
    modifiedBy: string = 'moderator'
  ): void => {
    const fieldsToTrack: (keyof UserProfile)[] = [
      'nom',
      'age',
      'genre',
      'poids',
      'taille',
      'experience',
      'stressLevel',
      'sleepQuality',
      'objectifPrincipal',
      'delaiObjectif',
      'materiel',
      'blessures_actives',
      'tags',
      'private_notes'
    ];

    fieldsToTrack.forEach(field => {
      const oldValue = oldClient[field];
      const newValue = newClient[field];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        let description = '';
        
        if (field === 'nom') {
          description = `Nom modifié de "${oldValue}" à "${newValue}"`;
        } else if (field === 'objectifPrincipal') {
          description = `Objectif modifié de "${oldValue}" à "${newValue}"`;
        } else if (field === 'tags') {
          const oldTags = (oldValue as string[]) || [];
          const newTags = (newValue as string[]) || [];
          const added = newTags.filter(t => !oldTags.includes(t));
          const removed = oldTags.filter(t => !newTags.includes(t));
          description = `Tags modifiés: ${added.length > 0 ? `+${added.join(', ')}` : ''} ${removed.length > 0 ? `-${removed.join(', ')}` : ''}`;
        } else if (field === 'blessures_actives') {
          const oldInjuries = (oldValue as string[]) || [];
          const newInjuries = (newValue as string[]) || [];
          const added = newInjuries.filter(i => !oldInjuries.includes(i));
          const removed = oldInjuries.filter(i => !newInjuries.includes(i));
          description = `Blessures modifiées: ${added.length > 0 ? `+${added.join(', ')}` : ''} ${removed.length > 0 ? `-${removed.join(', ')}` : ''}`;
        } else {
          description = `${field} modifié de "${oldValue}" à "${newValue}"`;
        }

        HistoryService.logModification(
          oldClient.id,
          field,
          oldValue,
          newValue,
          description,
          modifiedBy
        );
      }
    });

    // Tracker les changements de programme
    if (oldClient.activeProgram?.id !== newClient.activeProgram?.id) {
      HistoryService.logModification(
        oldClient.id,
        'activeProgram',
        oldClient.activeProgram?.name || 'Aucun',
        newClient.activeProgram?.name || 'Aucun',
        `Programme ${oldClient.activeProgram ? 'changé' : 'assigné'}: ${newClient.activeProgram?.name || 'Aucun'}`,
        modifiedBy
      );
    }
  },

  /**
   * Supprime l'historique d'un client
   */
  clearClientHistory: (clientId: string): void => {
    const history = HistoryService.getHistory();
    const filtered = history.filter(h => h.clientId !== clientId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  /**
   * Supprime tout l'historique
   */
  clearAllHistory: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  }
};

