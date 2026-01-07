import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService } from '../../services/storageService';
import { UserProfile } from '../../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('StorageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('loadClients', () => {
    it('should return empty array when no data exists', () => {
      const clients = StorageService.loadClients();
      expect(clients).toEqual([]);
    });

    it('should load clients from localStorage', () => {
      const mockClients: UserProfile[] = [
        {
          id: '1',
          nom: 'Test Client',
          age: 30,
          genre: 'Homme',
          poids: '70',
          taille: '175',
          experience: 'Débutant',
          stressLevel: 'Moyen',
          sleepQuality: 'Moyenne',
          materiel: 'Standard',
          objectifs: [],
          objectifPrincipal: 'Test',
          delaiObjectif: '12 SEMAINES',
          blessures_actives: [],
          historique_dates: [],
          historique_volume: [],
          sessionRecords: [],
          personalBests: {},
          exerciseTrends: {},
        },
      ];

      localStorage.setItem('hygie_elite_v1_data', JSON.stringify(mockClients));
      const clients = StorageService.loadClients();
      expect(clients).toEqual(mockClients);
    });
  });

  describe('addClient', () => {
    it('should add a new client', () => {
      const newClient: UserProfile = {
        id: '1',
        nom: 'New Client',
        age: 25,
        genre: 'Femme',
        poids: '60',
        taille: '165',
        experience: 'Débutant',
        stressLevel: 'Bas',
        sleepQuality: 'Excellente',
        materiel: 'Standard',
        objectifs: [],
        objectifPrincipal: 'Test',
        delaiObjectif: '12 SEMAINES',
        blessures_actives: [],
        historique_dates: [],
        historique_volume: [],
        sessionRecords: [],
        personalBests: {},
        exerciseTrends: {},
      };

      const clients = StorageService.addClient(newClient);
      expect(clients).toHaveLength(1);
      expect(clients[0]).toEqual(newClient);
    });

    it('should not add duplicate clients', () => {
      const client: UserProfile = {
        id: '1',
        nom: 'Client',
        age: 30,
        genre: 'Homme',
        poids: '70',
        taille: '175',
        experience: 'Débutant',
        stressLevel: 'Moyen',
        sleepQuality: 'Moyenne',
        materiel: 'Standard',
        objectifs: [],
        objectifPrincipal: 'Test',
        delaiObjectif: '12 SEMAINES',
        blessures_actives: [],
        historique_dates: [],
        historique_volume: [],
        sessionRecords: [],
        personalBests: {},
        exerciseTrends: {},
      };

      StorageService.addClient(client);
      const clients = StorageService.addClient(client);
      expect(clients).toHaveLength(1);
    });
  });

  describe('updateClient', () => {
    it('should update an existing client', () => {
      const client: UserProfile = {
        id: '1',
        nom: 'Client',
        age: 30,
        genre: 'Homme',
        poids: '70',
        taille: '175',
        experience: 'Débutant',
        stressLevel: 'Moyen',
        sleepQuality: 'Moyenne',
        materiel: 'Standard',
        objectifs: [],
        objectifPrincipal: 'Test',
        delaiObjectif: '12 SEMAINES',
        blessures_actives: [],
        historique_dates: [],
        historique_volume: [],
        sessionRecords: [],
        personalBests: {},
        exerciseTrends: {},
      };

      StorageService.addClient(client);
      const updated = StorageService.updateClient({ id: '1', nom: 'Updated Client' });
      expect(updated[0].nom).toBe('Updated Client');
    });
  });

  describe('clearAllClients', () => {
    it('should clear all clients', () => {
      const client: UserProfile = {
        id: '1',
        nom: 'Client',
        age: 30,
        genre: 'Homme',
        poids: '70',
        taille: '175',
        experience: 'Débutant',
        stressLevel: 'Moyen',
        sleepQuality: 'Moyenne',
        materiel: 'Standard',
        objectifs: [],
        objectifPrincipal: 'Test',
        delaiObjectif: '12 SEMAINES',
        blessures_actives: [],
        historique_dates: [],
        historique_volume: [],
        sessionRecords: [],
        personalBests: {},
        exerciseTrends: {},
      };

      StorageService.addClient(client);
      const cleared = StorageService.clearAllClients();
      expect(cleared).toEqual([]);
    });
  });
});





