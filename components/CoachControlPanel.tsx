import React, { useState, useEffect } from 'react';
import { UserProfile, WorkoutPlan } from '../types';
import { StorageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';

interface CoachControlPanelProps {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  setClients: React.Dispatch<React.SetStateAction<UserProfile[]>>;
  setWorkout: (workout: WorkoutPlan | null) => void;
  isTyping: boolean;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
}

export const CoachControlPanel: React.FC<CoachControlPanelProps> = ({
  profile,
  setProfile,
  setClients,
  setWorkout,
  isTyping,
  setIsTyping
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [privateNotes, setPrivateNotes] = useState(profile.private_notes || '');
  const [overrideGoal, setOverrideGoal] = useState(profile.objectifPrincipal);
  const [overrideProgress, setOverrideProgress] = useState(profile.activeGoal?.currentValue || 0);

  // Synchronise les états locaux avec le profil quand il change
  useEffect(() => {
    setPrivateNotes(profile.private_notes || '');
    setOverrideGoal(profile.objectifPrincipal);
    setOverrideProgress(profile.activeGoal?.currentValue || 0);
  }, [profile]);

  const savePrivateNotes = () => {
    const updatedProfile = { ...profile, private_notes: privateNotes };
    const newClientsList = StorageService.updateClient(updatedProfile);
    setClients(newClientsList);
    setProfile(updatedProfile);
    notificationService.success("Notes privées sauvegardées.");
  };

  const overrideGoalAndProgress = () => {
    const updatedProfile: UserProfile = {
      ...profile,
      objectifPrincipal: overrideGoal,
      activeGoal: profile.activeGoal ? {
        ...profile.activeGoal,
        currentValue: overrideProgress,
        label: overrideGoal
      } : undefined
    };
    const newClientsList = StorageService.updateClient(updatedProfile);
    setClients(newClientsList);
    setProfile(updatedProfile);
    notificationService.success("Objectif et progression mis à jour.");
  };

  // Calcule le sommeil moyen de la semaine (simulation - à adapter selon vos données)
  const calculateWeeklySleepAverage = (): number => {
    // Pour l'instant, on utilise la qualité de sommeil actuelle
    const sleepMap = { 'Mauvaise': 5, 'Moyenne': 7, 'Excellente': 9 };
    return sleepMap[profile.sleepQuality] || 7;
  };

  const weeklySleep = profile.weeklySleepAverage || calculateWeeklySleepAverage();

  return (
    <div className="fixed top-20 md:top-24 right-2 md:right-4 z-[100]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[var(--primary-gold)] text-black px-4 md:px-5 py-2 md:py-3 rounded-xl font-bebas text-xs md:text-sm uppercase hover:bg-amber-500 transition-all duration-300 shadow-2xl border-2 border-amber-600 flex items-center gap-2 hover:scale-105 active:scale-95 button-touch focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
        aria-label={isOpen ? 'Fermer le panneau coach' : 'Ouvrir le panneau coach'}
        aria-expanded={isOpen}
      >
        <span className="text-base md:text-lg transition-transform duration-300">{isOpen ? '▼' : '⚙'}</span>
        <span className="hidden sm:inline">PANEL COACH</span>
      </button>

      {isOpen && (
        <div className="mt-3 w-[calc(100vw-1rem)] sm:w-96 bg-[#0d0d0d] border-2 border-[var(--primary-teal)] rounded-2xl p-4 md:p-5 space-y-4 md:space-y-5 shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar animate-fadeIn backdrop-blur-xl">
          {/* Red Flags */}
          <div className="bg-gradient-to-br from-red-900/40 to-red-800/20 border-2 border-red-600 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">⚠️</span>
              <p className="text-[11px] font-bebas text-red-400 uppercase tracking-wider">RED FLAGS</p>
            </div>
            <div className="space-y-3 text-xs">
              {profile.lastPainReport ? (
                <div className="bg-black/40 rounded-lg p-3 border border-red-800">
                  <p className="text-red-300 font-bebas text-sm mb-1">📍 {profile.lastPainReport.location}</p>
                  <div className="flex items-center gap-4">
                    <p className="text-gray-400">Intensité: <span className="text-red-400 font-bold">{profile.lastPainReport.intensity}/10</span></p>
                    <p className="text-gray-500 text-[10px]">{profile.lastPainReport.date}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-black/40 rounded-lg p-3 border border-gray-800">
                  <p className="text-gray-500 text-center">✓ Aucune douleur signalée</p>
                </div>
              )}
              <div className="bg-black/40 rounded-lg p-3 border border-gray-800">
                <div className="flex items-center justify-between">
                  <p className="text-gray-300">Sommeil moyen:</p>
                  <p className={`font-bebas text-lg ${weeklySleep < 6 ? 'text-red-400' : weeklySleep < 7 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {weeklySleep.toFixed(1)}h
                  </p>
                </div>
                {weeklySleep < 6 && (
                  <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1">
                    <span>⚠️</span> Sommeil insuffisant - Risque de récupération altérée
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Notes Privées */}
          <div className="bg-[#161616] rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📝</span>
              <p className="text-[11px] font-bebas text-[var(--primary-teal)] uppercase tracking-wider">NOTES PRIVÉES</p>
            </div>
            <textarea
              value={privateNotes}
              onChange={(e) => setPrivateNotes(e.target.value)}
              placeholder="Observations privées que le client ne verra pas..."
              className="w-full h-28 bg-black/60 border border-gray-700 rounded-lg p-3 text-xs text-gray-300 font-mono focus:border-[var(--primary-teal)] outline-none resize-none transition-all duration-200 focus:bg-black/80"
            />
            <button
              onClick={savePrivateNotes}
              className="mt-3 w-full py-2.5 bg-[var(--primary-gold)] text-black rounded-lg text-xs font-bebas uppercase hover:bg-amber-500 transition-all duration-200 font-bold hover:scale-[1.02] active:scale-[0.98]"
            >
              💾 Sauvegarder Notes
            </button>
          </div>

          {/* Override Objectif */}
          <div className="bg-[#161616] rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎯</span>
              <p className="text-[11px] font-bebas text-[var(--elite-yellow)] uppercase tracking-wider">OVERRIDE OBJECTIF</p>
            </div>
            <input
              value={overrideGoal}
              onChange={(e) => setOverrideGoal(e.target.value)}
              className="w-full bg-black/60 border border-gray-700 rounded-lg p-3 text-sm text-white font-bebas mb-3 focus:border-[var(--primary-teal)] outline-none transition-all duration-200 focus:bg-black/80"
              placeholder="Nouvel objectif principal"
            />
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <p className="text-[9px] font-mono text-gray-500 uppercase mb-1">Progression %</p>
                <input
                  type="number"
                  value={overrideProgress}
                  onChange={(e) => setOverrideProgress(parseInt(e.target.value) || 0)}
                  className="w-full bg-black/60 border border-gray-700 rounded-lg p-2 text-sm text-white font-bebas focus:border-[var(--primary-teal)] outline-none transition-all duration-200 focus:bg-black/80"
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>
              <button
                onClick={overrideGoalAndProgress}
                className="px-6 py-3 bg-red-600 text-white rounded-lg text-xs font-bebas uppercase hover:bg-red-700 transition-all duration-200 font-bold hover:scale-[1.02] active:scale-[0.98]"
              >
                ⚡ Appliquer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

