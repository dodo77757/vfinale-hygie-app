import { PlannedSession } from '../types';

/**
 * Vérifie si deux dates correspondent au même jour (ignore l'heure)
 */
export const isSameDay = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  
  return d1.getTime() === d2.getTime();
};

/**
 * Déduplique les séances planifiées
 * Si deux séances ont la même date et le même clientId, on garde la plus récente (ou la première si dates identiques)
 * 
 * @param sessions - Tableau de séances planifiées
 * @returns Tableau de séances dédupliquées
 */
export const deduplicateSessions = (sessions: PlannedSession[]): PlannedSession[] => {
  if (!sessions || sessions.length === 0) return [];
  
  // Créer un Map pour stocker les séances uniques par clé (date + clientId)
  const uniqueSessionsMap = new Map<string, PlannedSession>();
  
  sessions.forEach(session => {
    const sessionDate = new Date(session.date);
    sessionDate.setHours(0, 0, 0, 0);
    
    // Clé unique : date (ISO string du jour) + clientId
    const key = `${sessionDate.toISOString().split('T')[0]}_${session.clientId}`;
    
    const existingSession = uniqueSessionsMap.get(key);
    
    if (!existingSession) {
      // Première séance avec cette clé, on l'ajoute
      uniqueSessionsMap.set(key, session);
    } else {
      // Séance dupliquée détectée
      // On garde la plus récente (basée sur l'ID ou la date de création)
      // Si les IDs sont des timestamps, on compare les IDs
      const existingId = existingSession.id;
      const currentId = session.id;
      
      // Si l'ID contient un timestamp, on compare
      const existingTimestamp = extractTimestampFromId(existingId);
      const currentTimestamp = extractTimestampFromId(currentId);
      
      if (currentTimestamp && existingTimestamp) {
        // On garde la plus récente
        if (currentTimestamp > existingTimestamp) {
          uniqueSessionsMap.set(key, session);
        }
      } else {
        // Sinon, on garde celle avec le workoutPlan si disponible
        if (session.workoutPlan && !existingSession.workoutPlan) {
          uniqueSessionsMap.set(key, session);
        }
      }
    }
  });
  
  return Array.from(uniqueSessionsMap.values());
};

/**
 * Extrait un timestamp d'un ID de séance (si l'ID contient un timestamp)
 */
const extractTimestampFromId = (id: string): number | null => {
  // Format attendu : "planned_auto_1234567890_0" ou similaire
  const match = id.match(/(\d{10,})/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
};

