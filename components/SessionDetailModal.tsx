import React from 'react';
import { SessionRecord } from '../types';

interface SessionDetailModalProps {
  session: SessionRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  isOpen,
  onClose
}) => {
  if (!isOpen || !session) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (): number => {
    return session.exercices?.reduce((sum, ex) => 
      sum + (ex.tempsEffortEffectif || 0) + (ex.tempsReposEffectif || 0), 0) || 0;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bebas text-gray-800 uppercase">Détails de la Séance</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-teal-50">
              <p className="text-xs text-gray-600 uppercase mb-1">Date</p>
              <p className="text-sm font-semibold text-gray-800">{formatDate(session.date)}</p>
            </div>
            <div className="p-4 rounded-xl bg-teal-50">
              <p className="text-xs text-gray-600 uppercase mb-1">Volume Total</p>
              <p className="text-sm font-semibold text-gray-800">{Math.round(session.tonnage || 0)} kg</p>
            </div>
            <div className="p-4 rounded-xl bg-teal-50">
              <p className="text-xs text-gray-600 uppercase mb-1">Durée</p>
              <p className="text-sm font-semibold text-gray-800">{formatDuration(calculateDuration())}</p>
            </div>
            <div className="p-4 rounded-xl bg-teal-50">
              <p className="text-xs text-gray-600 uppercase mb-1">Humeur</p>
              <p className="text-sm font-semibold text-gray-800">{session.mood || 'N/A'}</p>
            </div>
          </div>

          {/* Focus */}
          {session.focus && (
            <div className="p-4 rounded-xl bg-gray-50">
              <p className="text-xs text-gray-600 uppercase mb-1">Focus de la Séance</p>
              <p className="text-base font-semibold text-gray-800">{session.focus}</p>
            </div>
          )}

          {/* Liste des exercices */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Exercices Effectués</h3>
            <div className="space-y-3">
              {session.exercices?.map((exo, index) => (
                <div key={index} className="p-4 rounded-xl bg-white border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-base font-semibold text-gray-800">{exo.nom}</h4>
                    <span className="text-sm text-gray-600">{exo.sets} séries × {exo.reps}</span>
                  </div>
                  {exo.description && (
                    <p className="text-sm text-gray-600 mb-2">{exo.description}</p>
                  )}
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {exo.poidsEffetue && (
                      <div>
                        <p className="text-xs text-gray-600 uppercase">Poids</p>
                        <p className="text-sm font-semibold text-gray-800">{exo.poidsEffetue} kg</p>
                      </div>
                    )}
                    {exo.repsEffectuees && (
                      <div>
                        <p className="text-xs text-gray-600 uppercase">Reps</p>
                        <p className="text-sm font-semibold text-gray-800">{exo.repsEffectuees}</p>
                      </div>
                    )}
                    {exo.tempsEffortEffectif && (
                      <div>
                        <p className="text-xs text-gray-600 uppercase">Temps Effort</p>
                        <p className="text-sm font-semibold text-gray-800">{exo.tempsEffortEffectif}s</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback IA */}
          {session.debrief && (
            <div className="p-6 rounded-xl bg-gradient-to-br from-teal-50 to-white border border-teal-200">
              <p className="text-xs text-gray-600 uppercase mb-2">Feedback IA</p>
              <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">{session.debrief}</p>
            </div>
          )}

          {/* Objectifs atteints */}
          {session.objectifs_atteints !== undefined && (
            <div className="p-4 rounded-xl bg-gray-50">
              <p className="text-xs text-gray-600 uppercase mb-1">Objectifs</p>
              <p className={`text-base font-semibold ${session.objectifs_atteints ? 'text-teal-600' : 'text-gray-600'}`}>
                {session.objectifs_atteints ? '✓ Objectifs atteints' : 'Objectifs partiellement atteints'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};


