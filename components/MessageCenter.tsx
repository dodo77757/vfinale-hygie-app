import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Message } from '../types';
import { MessageService } from '../services/messageService';

interface MessageCenterProps {
  client: UserProfile;
  onClose?: () => void;
}

export const MessageCenter: React.FC<MessageCenterProps> = ({
  client,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const conversation = MessageService.getClientConversation(client.id);
    if (conversation) {
      setMessages(conversation.messages);
      MessageService.markAsRead(client.id);
    }
  }, [client.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const message = MessageService.sendMessage(client.id, newMessage.trim(), 'moderator');
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-[#007c89]/20 rounded-lg shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#007c89]/20">
        <div>
          <h3 className="font-bebas text-lg text-[#181818]">Messages</h3>
          <p className="text-xs text-[#6B7280]">{client.nom}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#181818] text-xl"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-[#6B7280] text-sm">
            Aucun message. Commencez la conversation.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'moderator' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  message.sender === 'moderator'
                    ? 'bg-[#007c89] text-white'
                    : 'bg-[#f3efe5] text-[#181818]'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.sender === 'moderator' ? 'text-white/70' : 'text-[#6B7280]'
                  }`}
                >
                  {new Date(message.timestamp).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#007c89]/20">
        <div className="flex gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tapez votre message..."
            rows={2}
            className="flex-1 bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] placeholder:text-[#6B7280] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20 resize-none"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className="px-4 py-2 bg-[#007c89] text-white rounded-md text-sm font-semibold hover:bg-[#006a75] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
};

