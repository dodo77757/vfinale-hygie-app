/**
 * Service de notification centralisé pour remplacer les alert()
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

type NotificationCallback = (notification: Notification) => void;

class NotificationService {
  private listeners: NotificationCallback[] = [];
  private notificationId = 0;

  subscribe(callback: NotificationCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify(notification: Omit<Notification, 'id'>) {
    const id = `notification-${++this.notificationId}`;
    const fullNotification: Notification = { ...notification, id };
    this.listeners.forEach(listener => listener(fullNotification));
  }

  success(message: string, duration = 3000) {
    this.notify({ type: 'success', message, duration });
  }

  error(message: string, duration = 5000) {
    this.notify({ type: 'error', message, duration });
  }

  warning(message: string, duration = 4000) {
    this.notify({ type: 'warning', message, duration });
  }

  info(message: string, duration = 3000) {
    this.notify({ type: 'info', message, duration });
  }
}

export const notificationService = new NotificationService();





