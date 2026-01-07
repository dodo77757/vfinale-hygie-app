import { UserProfile } from '../types';

const STORAGE_KEY = 'hygie_elite_v1_data';

// Données initiales (Base de données par défaut si vide)
const INITIAL_MOCK_CLIENTS: UserProfile[] = [];

/**
 * Fonction utilitaire pour faire un deep merge de deux objets UserProfile
 * Préserve toutes les propriétés existantes et fusionne les objets imbriqués
 */
const deepMergeProfile = (existing: UserProfile, updates: Partial<UserProfile>): UserProfile => {
  const merged: UserProfile = { ...existing };
  
  // Pour chaque propriété dans les mises à jour
  for (const key in updates) {
    if (updates.hasOwnProperty(key)) {
      const value = updates[key];
      
      // Si c'est un objet et que la valeur existante est aussi un objet, on fait un merge
      if (value && typeof value === 'object' && !Array.isArray(value) && existing[key as keyof UserProfile]) {
        const existingValue = existing[key as keyof UserProfile];
        if (existingValue && typeof existingValue === 'object' && !Array.isArray(existingValue)) {
          merged[key as keyof UserProfile] = { ...existingValue as any, ...value as any } as any;
        } else {
          merged[key as keyof UserProfile] = value as any;
        }
      }
      // Pour les tableaux, on préserve l'existant si la nouvelle valeur est vide/undefined
      else if (Array.isArray(value) && value.length > 0) {
        merged[key as keyof UserProfile] = value as any;
      }
      // Pour les autres valeurs, on utilise la nouvelle valeur si elle est définie
      else if (value !== undefined && value !== null) {
        merged[key as keyof UserProfile] = value as any;
      }
    }
  }
  
  return merged;
};

/**
 * Service de gestion de la persistance des données dans localStorage
 * 
 * @example
 * ```typescript
 * // Charger tous les clients
 * const clients = StorageService.loadClients();
 * 
 * // Ajouter un nouveau client
 * const updatedClients = StorageService.addClient(newClient);
 * 
 * // Mettre à jour un client
 * const updated = StorageService.updateClient({ id: '1', nom: 'Nouveau nom' });
 * ```
 */
export const StorageService = {
  /**
   * Charge tous les clients depuis le stockage local.
   * Si aucune donnée n'existe, retourne un tableau vide.
   * 
   * @returns {UserProfile[]} Liste de tous les clients sauvegardés
   * @throws {Error} Si les données sont corrompues, retourne un tableau vide
   */
  loadClients: (): UserProfile[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return INITIAL_MOCK_CLIENTS;
      
      const parsed = JSON.parse(saved);
      // Validation basique : s'assurer que c'est un tableau
      return Array.isArray(parsed) ? parsed : INITIAL_MOCK_CLIENTS;
    } catch (e) {
      console.error("Erreur de lecture du stockage", e);
      return INITIAL_MOCK_CLIENTS;
    }
  },

  /**
   * Sauvegarde la liste complète des clients avec validation.
   * 
   * @param {UserProfile[]} clients - Liste des clients à sauvegarder
   * @throws {Error} Si la sauvegarde échoue, log l'erreur mais ne bloque pas
   */
  saveClients: (clients: UserProfile[]): void => {
    try {
      // Validation : s'assurer qu'on a un tableau valide
      if (!Array.isArray(clients)) {
        console.error("Tentative de sauvegarde d'un tableau invalide");
        return;
      }
      
      const serialized = JSON.stringify(clients);
      localStorage.setItem(STORAGE_KEY, serialized);
      
      // Vérification que la sauvegarde a réussi
      const verification = localStorage.getItem(STORAGE_KEY);
      if (!verification || verification !== serialized) {
        console.error("Échec de la vérification de sauvegarde");
      }
    } catch (e) {
      console.error("Erreur d'écriture dans le stockage", e);
      // Tentative de récupération en cas d'erreur
      try {
        const backup = StorageService.loadClients();
        if (backup.length > 0) {
          console.warn("Restauration depuis la sauvegarde précédente");
        }
      } catch (backupError) {
        console.error("Impossible de restaurer la sauvegarde", backupError);
      }
    }
  },

  /**
   * Met à jour un client spécifique dans la liste et sauvegarde.
   * Fait un deep merge pour préserver toutes les propriétés existantes.
   * 
   * @param {Partial<UserProfile> & { id: string }} updatedClient - Client avec les propriétés à mettre à jour (id requis)
   * @returns {UserProfile[]} Liste mise à jour des clients
   * @throws {Error} Si le client n'existe pas et n'a pas toutes les propriétés requises, retourne la liste inchangée
   */
  updateClient: (updatedClient: Partial<UserProfile> & { id: string }): UserProfile[] => {
    const currentClients = StorageService.loadClients();
    
    // Trouve le client existant
    const existingClient = currentClients.find(c => c.id === updatedClient.id);
    
    if (!existingClient) {
      console.warn(`Client avec l'ID ${updatedClient.id} non trouvé. Ajout comme nouveau client.`);
      // Si le client n'existe pas mais qu'on a toutes les propriétés requises, on l'ajoute
      if ('nom' in updatedClient && 'age' in updatedClient) {
        const newClients = [...currentClients, updatedClient as UserProfile];
        StorageService.saveClients(newClients);
        return newClients;
      }
      return currentClients;
    }
    
    // Fait un deep merge pour préserver toutes les propriétés
    const mergedClient = deepMergeProfile(existingClient, updatedClient);
    
    const newClients = currentClients.map(c => 
      c.id === updatedClient.id ? mergedClient : c
    );
    
    StorageService.saveClients(newClients);
    return newClients;
  },

  /**
   * Ajoute un nouveau client et sauvegarde.
   * Vérifie que le client n'existe pas déjà (basé sur l'ID).
   * Si le client existe déjà, effectue une mise à jour au lieu d'un ajout.
   * 
   * @param {UserProfile} newClient - Nouveau client à ajouter
   * @returns {UserProfile[]} Liste mise à jour des clients
   */
  addClient: (newClient: UserProfile): UserProfile[] => {
    const currentClients = StorageService.loadClients();
    
    // Vérifie si le client existe déjà
    if (currentClients.some(c => c.id === newClient.id)) {
      console.warn(`Client avec l'ID ${newClient.id} existe déjà. Mise à jour au lieu d'ajout.`);
      return StorageService.updateClient(newClient);
    }
    
    const newClients = [...currentClients, newClient];
    StorageService.saveClients(newClients);
    return newClients;
  },
  
  /**
   * Met à jour une propriété spécifique d'un client sans écraser le reste.
   * Utile pour les mises à jour partielles.
   */
  updateClientProperty: <K extends keyof UserProfile>(
    clientId: string,
    property: K,
    value: UserProfile[K]
  ): UserProfile[] => {
    return StorageService.updateClient({ id: clientId, [property]: value } as Partial<UserProfile> & { id: string });
  },

  /**
   * Réinitialise les données aux valeurs d'usine (Mock).
   */
  resetFactorySettings: (): UserProfile[] => {
    StorageService.saveClients(INITIAL_MOCK_CLIENTS);
    return INITIAL_MOCK_CLIENTS;
  },

  /**
   * Supprime tous les clients de la base de données.
   */
  clearAllClients: (): UserProfile[] => {
    StorageService.saveClients([]);
    return [];
  }
};