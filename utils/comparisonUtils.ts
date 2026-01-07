import { UserProfile } from '../types';

/**
 * Compare deux tableaux de clients en comparant uniquement les IDs et propriétés essentielles
 * Plus efficace que JSON.stringify() et évite les problèmes d'ordre des propriétés
 */
export function areClientsEqual(clients1: UserProfile[], clients2: UserProfile[]): boolean {
  if (clients1.length !== clients2.length) {
    return false;
  }

  // Créer un Map pour un accès O(1)
  const clients2Map = new Map(clients2.map(c => [c.id, c]));

  for (const client1 of clients1) {
    const client2 = clients2Map.get(client1.id);
    
    if (!client2) {
      return false;
    }

    // Comparer les propriétés essentielles
    if (
      client1.id !== client2.id ||
      client1.nom !== client2.nom ||
      client1.objectifPrincipal !== client2.objectifPrincipal ||
      client1.activeGoal?.currentValue !== client2.activeGoal?.currentValue ||
      (client1.historique_dates?.length || 0) !== (client2.historique_dates?.length || 0) ||
      (client1.historique_volume?.length || 0) !== (client2.historique_volume?.length || 0) ||
      (client1.sessionRecords?.length || 0) !== (client2.sessionRecords?.length || 0)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Compare deux profils en comparant uniquement les propriétés essentielles
 */
export function areProfilesEqual(profile1: UserProfile | null, profile2: UserProfile | null): boolean {
  // Si l'un est null et l'autre non, ils ne sont pas égaux
  if (!profile1 || !profile2) {
    return profile1 === profile2;
  }
  
  if (profile1.id !== profile2.id) {
    return false;
  }

  // Comparer les propriétés essentielles qui changent fréquemment
  const essentialProps: (keyof UserProfile)[] = [
    'nom',
    'objectifPrincipal',
    'historique_dates',
    'historique_volume',
    'sessionRecords',
    'activeGoal',
    'activeProgram',
    'dernier_feedback_ia',
    'personalBests',
    'blessures_actives',
    'private_notes'
  ];

  for (const prop of essentialProps) {
    if (prop === 'activeGoal') {
      if (profile1.activeGoal?.currentValue !== profile2.activeGoal?.currentValue) {
        return false;
      }
    } else if (prop === 'historique_dates' || prop === 'historique_volume' || prop === 'sessionRecords') {
      const arr1 = profile1[prop] as any[];
      const arr2 = profile2[prop] as any[];
      if (arr1.length !== arr2.length) {
        return false;
      }
    } else if (profile1[prop] !== profile2[prop]) {
      return false;
    }
  }

  return true;
}

