import { Message, Conversation } from '../types';

const STORAGE_KEY = 'hygie_messages';

/**
 * Service pour gérer les messages entre modérateur et clients
 */
export const MessageService = {
  /**
   * Envoie un message
   */
  sendMessage: (
    clientId: string,
    content: string,
    sender: 'moderator' | 'client' = 'moderator'
  ): Message => {
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clientId,
      sender,
      content,
      timestamp: new Date().toISOString(),
      read: sender === 'moderator' // Les messages du modérateur sont lus par défaut
    };

    const conversations = MessageService.getConversations();
    let conversation = conversations.find(c => c.clientId === clientId);

    if (!conversation) {
      conversation = {
        clientId,
        messages: [],
        unreadCount: 0
      };
      conversations.push(conversation);
    }

    conversation.messages.push(message);
    conversation.lastMessage = message.timestamp;
    
    if (sender === 'client') {
      conversation.unreadCount += 1;
    } else {
      conversation.unreadCount = 0; // Réinitialiser si le modérateur répond
    }

    MessageService.saveConversations(conversations);
    return message;
  },

  /**
   * Récupère les conversations
   */
  getConversations: (): Conversation[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erreur lors de la lecture des messages:', error);
      return [];
    }
  },

  /**
   * Récupère la conversation d'un client
   */
  getClientConversation: (clientId: string): Conversation | null => {
    const conversations = MessageService.getConversations();
    return conversations.find(c => c.clientId === clientId) || null;
  },

  /**
   * Marque les messages comme lus
   */
  markAsRead: (clientId: string): void => {
    const conversations = MessageService.getConversations();
    const conversation = conversations.find(c => c.clientId === clientId);
    
    if (conversation) {
      conversation.messages.forEach(msg => {
        if (msg.sender === 'client') {
          msg.read = true;
        }
      });
      conversation.unreadCount = 0;
      MessageService.saveConversations(conversations);
    }
  },

  /**
   * Récupère le nombre total de messages non lus
   */
  getUnreadCount: (): number => {
    const conversations = MessageService.getConversations();
    return conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  },

  /**
   * Sauvegarde les conversations
   */
  saveConversations: (conversations: Conversation[]): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  },

  /**
   * Supprime une conversation
   */
  deleteConversation: (clientId: string): void => {
    const conversations = MessageService.getConversations();
    const filtered = conversations.filter(c => c.clientId !== clientId);
    MessageService.saveConversations(filtered);
  }
};

