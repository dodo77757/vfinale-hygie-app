import React from 'react';
import { UserProfile, PlannedSession, SessionRecord } from '../../types';
import { StorageService } from '../../services/storageService';
import { notificationService } from '../../services/notificationService';

interface SessionDetailCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: PlannedSession | SessionRecord | null;
  client: UserProfile | null;
  onUpdate?: (updatedClient: UserProfile) => void;
  onDelete?: () => void;
}

export const SessionDetailCalendarModal: React.FC<SessionDetailCalendarModalProps> = ({
  isOpen,
  onClose,
  session,
  client,
  onUpdate,
  onDelete
}) => {
  if (!isOpen || !session || !client) return null;

  const isPlanned = 'clientId' in session && !('tonnage' in session);
  const sessionDate = new Date(session.date);

  const handleDelete = () => {
    if (!window.confirm('Supprimer cette session ?')) return;

    if (isPlanned) {
      const updatedClient: UserProfile = {
        ...client,
        plannedSessions: (client.plannedSessions || []).filter(ps => ps.id !== session.id)
      };
      const updatedClients = StorageService.updateClient(updatedClient);
      StorageService.saveClients(updatedClients);
      if (onUpdate) onUpdate(updatedClient);
      notificationService.success('Session planifiée supprimée');
    }
    
    if (onDelete) onDelete();
    onClose();
  };

  const handleMarkCompleted = () => {
    if (!isPlanned) return;

    // Convertir la session planifiée en session complétée
    const sessionRecord: SessionRecord = {
      date: session.date,
      exercices: [],
      tonnage: 0,
      mood: 'Neutre',
      debrief: 'Session complétée depuis le calendrier'
    };

    const updatedClient: UserProfile = {
      ...client,
      plannedSessions: (client.plannedSessions || []).filter(ps => ps.id !== session.id),
      sessionRecords: [...(client.sessionRecords || []), sessionRecord]
    };

    const updatedClients = StorageService.updateClient(updatedClient);
    StorageService.saveClients(updatedClients);
    if (onUpdate) onUpdate(updatedClient);
    notificationService.success('Session marquée comme complétée');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-[#181818]/80 flex items-center justify-center p-4 backdrop-blur-md" onClick={onClose}>
      <div
        className="bg-white border border-[#007c89]/20 rounded-lg w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#007c89]/20 p-4">
          <div>
            <h2 className="font-bebas text-xl text-[#181818]">
              {isPlanned ? 'Session Planifiée' : 'Session Complétée'}
            </h2>
            <p className="text-sm text-[#6B7280] mt-1">{client.nom}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#181818] text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Date et heure */}
          <div>
            <label className="block text-xs font-semibold text-[#007c89] uppercase mb-1">
              Date
            </label>
            <p className="text-sm text-[#181818]">
              {sessionDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p className="text-xs text-[#6B7280] mt-1">
              {sessionDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Notes */}
          {isPlanned && session.notes && (
            <div>
              <label className="block text-xs font-semibold text-[#007c89] uppercase mb-1">
                Notes
              </label>
              <p className="text-sm text-[#181818] whitespace-pre-wrap">{session.notes}</p>
            </div>
          )}

          {/* Détails session complétée */}
          {!isPlanned && 'tonnage' in session && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#007c89] uppercase mb-1">
                  Volume
                </label>
                <p className="text-sm text-[#181818] font-semibold">{session.tonnage} kg</p>
              </div>
              {session.exercices && session.exercices.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-[#007c89] uppercase mb-1">
                    Exercices
                  </label>
                  <p className="text-sm text-[#181818]">{session.exercices.length} exercices</p>
                </div>
              )}
              {session.debrief && (
                <div>
                  <label className="block text-xs font-semibold text-[#007c89] uppercase mb-1">
                    Feedback
                  </label>
                  <p className="text-sm text-[#181818] whitespace-pre-wrap">{session.debrief}</p>
                </div>
              )}
            </div>
          )}

          {/* Informations client */}
          <div className="pt-4 border-t border-[#007c89]/20">
            <label className="block text-xs font-semibold text-[#007c89] uppercase mb-2">
              Informations Client
            </label>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[#6B7280]">Objectif:</span>
                <p className="text-[#181818] font-semibold">{client.objectifPrincipal || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[#6B7280]">Sessions totales:</span>
                <p className="text-[#181818] font-semibold">{client.sessionRecords?.length || 0}</p>
              </div>
              {client.activeProgram && (
                <div className="col-span-2">
                  <span className="text-[#6B7280]">Programme:</span>
                  <p className="text-[#181818] font-semibold">{client.activeProgram.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-[#007c89]/20">
          {isPlanned && (
            <>
              <button
                onClick={handleMarkCompleted}
                className="flex-1 px-4 py-2 bg-[#007c89] text-white rounded-md text-sm font-semibold hover:bg-[#006a75] transition-all"
              >
                Marquer complétée
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-[#EF4444] text-white rounded-md text-sm font-semibold hover:bg-[#DC2626] transition-all"
              >
                Supprimer
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-[#181818] border border-[#007c89]/30 rounded-md text-sm font-semibold hover:bg-[#f3efe5] transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

