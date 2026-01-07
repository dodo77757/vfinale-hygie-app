import React, { useState } from 'react';
import { UserProfile, RecoveryEntry } from '../types';

interface RecoveryJournalProps {
  profile: UserProfile;
  onSave: (entry: RecoveryEntry) => void;
}

export const RecoveryJournal: React.FC<RecoveryJournalProps> = ({
  profile,
  onSave
}) => {
  const [sleepQuality, setSleepQuality] = useState<'Mauvaise' | 'Moyenne' | 'Excellente'>('Moyenne');
  const [energyLevel, setEnergyLevel] = useState(5);
  const [painLevel, setPainLevel] = useState(0);
  const [notes, setNotes] = useState('');

  const todayEntry = profile.recoveryJournal?.find(
    entry => new Date(entry.date).toDateString() === new Date().toDateString()
  );

  const handleSave = () => {
    const entry: RecoveryEntry = {
      date: new Date().toISOString(),
      sleepQuality,
      energyLevel,
      painLevel,
      notes: notes.trim() || undefined
    };
    onSave(entry);
    // Reset form
    setSleepQuality('Moyenne');
    setEnergyLevel(5);
    setPainLevel(0);
    setNotes('');
  };

  const calculateRecoveryScore = (): number => {
    const sleepScore = sleepQuality === 'Excellente' ? 10 : sleepQuality === 'Moyenne' ? 6 : 3;
    const energyScore = energyLevel;
    const painPenalty = painLevel * 0.5;
    return Math.round((sleepScore + energyScore - painPenalty) / 2);
  };

  const recoveryScore = calculateRecoveryScore();
  const recoveryStatus = recoveryScore >= 7 ? 'excellent' : recoveryScore >= 5 ? 'bon' : 'faible';

  return (
    <div className="p-8 rounded-3xl bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-[0_8px_32px_rgba(31,38,135,0.08)] hover:shadow-[0_12px_48px_rgba(56,189,248,0.12)] transition-all duration-500">
      <h3 className="text-2xl font-semibold text-gray-800 mb-8 tracking-tight">Journal de Récupération</h3>

      {todayEntry ? (
        <div className="p-6 rounded-2xl bg-teal-50/80 backdrop-blur-sm border border-teal-200/50 shadow-sm">
          <p className="text-sm text-teal-700 mb-4 font-semibold">✓ Entrée enregistrée aujourd'hui</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-600 uppercase">Sommeil</p>
              <p className="font-semibold text-gray-800">{todayEntry.sleepQuality}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase">Énergie</p>
              <p className="font-semibold text-gray-800">{todayEntry.energyLevel}/10</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase">Douleur</p>
              <p className="font-semibold text-gray-800">{todayEntry.painLevel}/10</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Qualité du sommeil */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Qualité du sommeil
            </label>
            <div className="flex gap-3">
              {(['Mauvaise', 'Moyenne', 'Excellente'] as const).map((quality) => (
                <button
                  key={quality}
                  onClick={() => setSleepQuality(quality)}
                  className={`flex-1 py-3.5 rounded-2xl font-semibold transition-all duration-500 ${
                    sleepQuality === quality
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-[0_4px_20px_rgba(20,184,166,0.3)] scale-105'
                      : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-gray-100/80 border border-gray-200/50 shadow-sm hover:shadow-md'
                  }`}
                >
                  {quality}
                </button>
              ))}
            </div>
          </div>

          {/* Niveau d'énergie */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Niveau d'énergie: {energyLevel}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={energyLevel}
              onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Très faible</span>
              <span>Très élevé</span>
            </div>
          </div>

          {/* Niveau de douleur */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Niveau de douleur: {painLevel}/10
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={painLevel}
              onChange={(e) => setPainLevel(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Aucune</span>
              <span>Intense</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Comment vous sentez-vous aujourd'hui ?"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              rows={3}
            />
          </div>

          {/* Score de récupération */}
          <div className={`p-4 rounded-xl border-2 ${
            recoveryStatus === 'excellent' ? 'bg-teal-50 border-teal-300' :
            recoveryStatus === 'bon' ? 'bg-yellow-50 border-yellow-300' :
            'bg-red-50 border-red-300'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 uppercase mb-1">Score de Récupération</p>
                <p className={`text-2xl font-bold ${
                  recoveryStatus === 'excellent' ? 'text-teal-700' :
                  recoveryStatus === 'bon' ? 'text-yellow-700' :
                  'text-red-700'
                }`}>
                  {recoveryScore}/10
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">
                  {recoveryStatus === 'excellent' ? '✓ Prêt pour l\'entraînement' :
                   recoveryStatus === 'bon' ? '⚠ Entraînement modéré' :
                   '✗ Repos recommandé'}
                </p>
              </div>
            </div>
          </div>

          {/* Bouton sauvegarder */}
          <button
            onClick={handleSave}
            className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-full font-semibold hover:from-teal-600 hover:to-cyan-600 transition-all duration-500 shadow-[0_4px_20px_rgba(20,184,166,0.3)] hover:shadow-[0_8px_32px_rgba(20,184,166,0.4)] hover:scale-105 relative overflow-hidden group"
          >
            <span className="relative z-10">Enregistrer</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </button>
        </div>
      )}

      {/* Historique récent */}
      {profile.recoveryJournal && profile.recoveryJournal.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm font-semibold text-gray-800 mb-3">Historique Récent</p>
          <div className="space-y-2">
            {profile.recoveryJournal.slice(-5).reverse().map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {entry.sleepQuality === 'Excellente' ? '😴' : entry.sleepQuality === 'Moyenne' ? '😌' : '😫'}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {new Date(entry.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-xs text-gray-600">
                      Énergie: {entry.energyLevel}/10 • Douleur: {entry.painLevel}/10
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

