import { useState, useRef, useCallback } from 'react';
import { UserProfile, PlannedSession } from '../types';
import { StorageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { CalendarValidationService } from '../services/calendarValidationService';

interface UseCalendarDragDropOptions {
  clients: UserProfile[];
  onUpdate: (updatedClients: UserProfile[]) => void;
}

export const useCalendarDragDrop = ({ clients, onUpdate }: UseCalendarDragDropOptions) => {
  const [draggedSession, setDraggedSession] = useState<{
    client: UserProfile;
    session: PlannedSession;
  } | null>(null);
  const dragStartRef = useRef<Date | null>(null);

  const handleDragStart = useCallback((client: UserProfile, session: PlannedSession, originalDate: Date) => {
    setDraggedSession({ client, session });
    dragStartRef.current = originalDate;
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedSession(null);
    dragStartRef.current = null;
  }, []);

  const handleDrop = useCallback((targetDate: Date, targetClientId?: string) => {
    if (!draggedSession || !dragStartRef.current) return;

    const { client, session } = draggedSession;
    const newDate = new Date(targetDate);
    
    // Vérifier les conflits
    const targetClient = targetClientId 
      ? clients.find(c => c.id === targetClientId)
      : client;

    if (!targetClient) return;

    // Utiliser le service de validation (en excluant la session qu'on déplace)
    const tempClient: UserProfile = {
      ...targetClient,
      plannedSessions: (targetClient.plannedSessions || []).filter(ps => ps.id !== session.id)
    };

    const validation = CalendarValidationService.canPlanSessionOnDate(tempClient, newDate);
    if (!validation.canPlan) {
      notificationService.error(validation.reason || 'Impossible de déplacer cette session - conflit détecté');
      return;
    }

    // Mettre à jour la session
    const updatedSessions = (targetClient.plannedSessions || []).map(ps => {
      if (ps.id === session.id) {
        return {
          ...ps,
          date: newDate.toISOString(),
          clientId: targetClientId || client.id
        };
      }
      return ps;
    });

    // Si le client change, retirer de l'ancien et ajouter au nouveau
    let allClients = [...clients];
    
    if (targetClientId && targetClientId !== client.id) {
      // Retirer de l'ancien client
      const oldClient = clients.find(c => c.id === client.id);
      if (oldClient) {
        const oldUpdated: UserProfile = {
          ...oldClient,
          plannedSessions: (oldClient.plannedSessions || []).filter(ps => ps.id !== session.id)
        };
        allClients = StorageService.updateClient(oldUpdated);
      }

      // Ajouter au nouveau client
      const newClient = allClients.find(c => c.id === targetClientId);
      if (newClient) {
        const newUpdated: UserProfile = {
          ...newClient,
          plannedSessions: [...(newClient.plannedSessions || []), {
            ...session,
            date: newDate.toISOString(),
            clientId: targetClientId
          }]
        };
        allClients = StorageService.updateClient(newUpdated);
      }
    } else {
      // Même client, juste mettre à jour la date
      const updatedClient: UserProfile = {
        ...targetClient,
        plannedSessions: updatedSessions
      };
      allClients = StorageService.updateClient(updatedClient);
    }

    StorageService.saveClients(allClients);
    onUpdate(allClients);
    notificationService.success('Session déplacée avec succès');
    
    setDraggedSession(null);
    dragStartRef.current = null;
  }, [draggedSession, clients, onUpdate]);

  return {
    draggedSession,
    handleDragStart,
    handleDragEnd,
    handleDrop
  };
};

