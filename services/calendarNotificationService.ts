import { UserProfile } from '../types';
import { ModeratorNotificationService } from './moderatorNotificationService';

const STORAGE_KEY = 'hygie_calendar_notifications_enabled';

/**
 * Service pour gérer les notifications et rappels du calendrier
 */
export const CalendarNotificationService = {
  /**
   * Active ou désactive les notifications
   */
  setNotificationsEnabled: (enabled: boolean): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
  },

  /**
   * Vérifie si les notifications sont activées
   */
  areNotificationsEnabled: (): boolean => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  },

  /**
   * Vérifie les sessions planifiées et crée des notifications
   */
  checkUpcomingSessions: (clients: UserProfile[]): void => {
    if (!CalendarNotificationService.areNotificationsEnabled()) return;

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    clients.forEach(client => {
      if (client.plannedSessions) {
        client.plannedSessions.forEach(session => {
          const sessionDate = new Date(session.date);
          
          // Notification 1 heure avant
          if (sessionDate > now && sessionDate <= oneHourFromNow) {
            ModeratorNotificationService.createNotification(
              'session',
              `Session dans 1h - ${client.nom}`,
              `Session planifiée à ${sessionDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
              client.id,
              'high'
            );
          }
          
          // Notification 1 jour avant
          if (sessionDate > now && sessionDate <= oneDayFromNow && sessionDate > oneHourFromNow) {
            ModeratorNotificationService.createNotification(
              'session',
              `Session demain - ${client.nom}`,
              `Session planifiée le ${sessionDate.toLocaleDateString('fr-FR')} à ${sessionDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
              client.id,
              'medium'
            );
          }
        });
      }
    });
  },

  /**
   * Vérifie les sessions en retard
   */
  checkOverdueSessions: (clients: UserProfile[]): void => {
    if (!CalendarNotificationService.areNotificationsEnabled()) return;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    clients.forEach(client => {
      if (client.plannedSessions) {
        client.plannedSessions.forEach(session => {
          const sessionDate = new Date(session.date);
          sessionDate.setHours(0, 0, 0, 0);

          // Session planifiée dans le passé non complétée
          if (sessionDate < now) {
            // Vérifier si complétée
            const isCompleted = client.sessionRecords?.some(record => {
              const recordDate = new Date(record.date);
              recordDate.setHours(0, 0, 0, 0);
              return recordDate.getTime() === sessionDate.getTime();
            });

            if (!isCompleted) {
              const daysOverdue = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
              
              ModeratorNotificationService.createNotification(
                'inactivity',
                `Session en retard - ${client.nom}`,
                `Session planifiée le ${sessionDate.toLocaleDateString('fr-FR')} non complétée (${daysOverdue} jour${daysOverdue > 1 ? 's' : ''} de retard)`,
                client.id,
                daysOverdue > 3 ? 'high' : 'medium'
              );
            }
          }
        });
      }
    });
  },

  /**
   * Vérifie les conflits de planification
   */
  checkConflicts: (clients: UserProfile[]): void => {
    if (!CalendarNotificationService.areNotificationsEnabled()) return;

    const sessionsByDate: Record<string, Array<{ client: UserProfile; session: any }>> = {};

    clients.forEach(client => {
      if (client.plannedSessions) {
        client.plannedSessions.forEach(session => {
          const dateKey = new Date(session.date).toISOString().split('T')[0];
          if (!sessionsByDate[dateKey]) {
            sessionsByDate[dateKey] = [];
          }
          sessionsByDate[dateKey].push({ client, session });
        });
      }
    });

    // Détecter les jours avec trop de sessions (surcharge)
    Object.entries(sessionsByDate).forEach(([dateKey, sessions]) => {
      if (sessions.length > 5) {
        const date = new Date(dateKey);
        ModeratorNotificationService.createNotification(
          'system',
          `Surcharge de planification`,
          `${sessions.length} sessions planifiées le ${date.toLocaleDateString('fr-FR')}`,
          undefined,
          'medium'
        );
      }
    });
  },

  /**
   * Demande la permission pour les notifications navigateur
   */
  requestBrowserNotificationPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  /**
   * Envoie une notification navigateur
   */
  sendBrowserNotification: (title: string, options?: NotificationOptions): void => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });
  },

  /**
   * Initialise le service de notifications
   */
  initialize: (clients: UserProfile[]): void => {
    // Vérifier les sessions à venir
    CalendarNotificationService.checkUpcomingSessions(clients);
    
    // Vérifier les sessions en retard
    CalendarNotificationService.checkOverdueSessions(clients);
    
    // Vérifier les conflits
    CalendarNotificationService.checkConflicts(clients);

    // Vérifier périodiquement (toutes les heures)
    setInterval(() => {
      CalendarNotificationService.checkUpcomingSessions(clients);
      CalendarNotificationService.checkOverdueSessions(clients);
    }, 60 * 60 * 1000);
  }
};

