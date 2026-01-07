import { Notification } from '../types';
import { UserProfile } from '../types';

const STORAGE_KEY = 'hygie_moderator_notifications';

/**
 * Service pour gérer les notifications du modérateur
 */
export const ModeratorNotificationService = {
  /**
   * Crée une notification
   */
  createNotification: (
    type: Notification['type'],
    title: string,
    message: string,
    clientId?: string,
    severity: Notification['severity'] = 'medium'
  ): Notification => {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      clientId,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      severity
    };

    const notifications = ModeratorNotificationService.getNotifications();
    notifications.unshift(notification);
    
    // Garder seulement les 500 dernières notifications
    const trimmed = notifications.slice(0, 500);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    return notification;
  },

  /**
   * Récupère toutes les notifications
   */
  getNotifications: (): Notification[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erreur lors de la lecture des notifications:', error);
      return [];
    }
  },

  /**
   * Récupère les notifications non lues
   */
  getUnreadNotifications: (): Notification[] => {
    return ModeratorNotificationService.getNotifications().filter(n => !n.read);
  },

  /**
   * Marque une notification comme lue
   */
  markAsRead: (notificationId: string): void => {
    const notifications = ModeratorNotificationService.getNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    }
  },

  /**
   * Marque toutes les notifications comme lues
   */
  markAllAsRead: (): void => {
    const notifications = ModeratorNotificationService.getNotifications();
    notifications.forEach(n => n.read = true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  },

  /**
   * Supprime une notification
   */
  deleteNotification: (notificationId: string): void => {
    const notifications = ModeratorNotificationService.getNotifications();
    const filtered = notifications.filter(n => n.id !== notificationId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  /**
   * Supprime toutes les notifications
   */
  clearAll: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  },

  /**
   * Analyse les clients et génère des notifications automatiques
   */
  analyzeClients: (clients: UserProfile[]): void => {
    clients.forEach(client => {
      // Notification pour douleur récente
      if (client.lastPainReport && client.lastPainReport.intensity >= 5) {
        const daysSince = client.lastPainReport.date
          ? Math.floor((Date.now() - new Date(client.lastPainReport.date).getTime()) / (1000 * 60 * 60 * 24))
          : Infinity;
        
        if (daysSince <= 7) {
          ModeratorNotificationService.createNotification(
            'pain',
            `Douleur signalée - ${client.nom}`,
            `Douleur ${client.lastPainReport.location} (${client.lastPainReport.intensity}/10)`,
            client.id,
            client.lastPainReport.intensity >= 7 ? 'high' : 'medium'
          );
        }
      }

      // Notification pour inactivité
      const hasRecentSession = client.sessionRecords && client.sessionRecords.length > 0;
      const lastSessionDate = hasRecentSession 
        ? new Date(client.sessionRecords[client.sessionRecords.length - 1].date)
        : null;
      const daysSinceLastSession = lastSessionDate 
        ? Math.floor((Date.now() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24))
        : Infinity;

      if (daysSinceLastSession > 30 && (client.activeProgram || hasRecentSession)) {
        ModeratorNotificationService.createNotification(
          'inactivity',
          `Client inactif - ${client.nom}`,
          `Pas de session depuis ${daysSinceLastSession} jours`,
          client.id,
          daysSinceLastSession > 60 ? 'high' : daysSinceLastSession > 45 ? 'medium' : 'low'
        );
      }

      // Notification pour blessures actives
      if (client.blessures_actives && client.blessures_actives.length > 0) {
        ModeratorNotificationService.createNotification(
          'injury',
          `Blessures actives - ${client.nom}`,
          `Blessures: ${client.blessures_actives.join(', ')}`,
          client.id,
          'medium'
        );
      }
    });
  }
};

