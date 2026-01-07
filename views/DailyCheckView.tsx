import React from 'react';
import { UserProfile } from '../types';

interface DailyCheckViewProps {
  profile: UserProfile;
  userRole: 'COACH' | 'CLIENT' | null;
  workout: any | null;
  onStartWorkout: () => void;
  onCreateProgram: () => void;
  onEditWorkout: () => void;
}

export const DailyCheckView: React.FC<DailyCheckViewProps> = ({
  profile,
  userRole,
  workout,
  onStartWorkout,
  onCreateProgram,
  onEditWorkout
}) => {
  return (
    <div className="max-w-4xl mx-auto py-20 text-center space-y-10 animate-fadeIn">
      <div className="hud-card p-12 rounded-[3rem] bg-[#161616] border-gray-700 space-y-8">
        <h2 className="text-6xl md:text-8xl font-bebas text-white uppercase">
          <span className="text-[var(--elite-yellow)]">{profile.nom.split(' ')[0]}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left bg-black/30 p-8 rounded-3xl border border-gray-800">
          <div>
            <p className="text-[10px] font-mono text-gray-500 uppercase">Objectif</p>
            <p className="text-xl font-bebas text-white">{profile.objectifPrincipal}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-gray-500 uppercase">Pathologies</p>
            <p className="text-sm font-mono text-red-300">
              {profile.blessures_actives.join(', ') || 'Aucune'}
            </p>
          </div>
        </div>
        
        {/* Affichage du programme actif */}
        {profile.activeProgram && (
          <div className="bg-[#0d0d0d] p-6 rounded-2xl border border-[var(--elite-yellow)]/30">
            <div className="flex items-center justify-between mb-4">
              <div className="text-left">
                <p className="text-[10px] font-mono text-[var(--elite-yellow)] uppercase">Programme Personnalisé</p>
                <p className="text-2xl font-bebas text-white">{profile.activeProgram.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono text-gray-500 uppercase">
                  Semaine {profile.activeProgram.currentWeek}/{profile.activeProgram.duration}
                </p>
                <p className="text-[10px] font-mono text-gray-500 uppercase">
                  Séance {profile.activeProgram.currentSession}/{profile.activeProgram.sessionsPerWeek}
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-900 rounded-full h-2 mb-2">
              <div
                className="bg-[var(--elite-yellow)] h-2 rounded-full transition-all"
                style={{
                  width: `${((profile.activeProgram.currentWeek - 1) * profile.activeProgram.sessionsPerWeek + profile.activeProgram.currentSession) / (profile.activeProgram.duration * profile.activeProgram.sessionsPerWeek) * 100}%`
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-[9px] font-mono text-gray-500 uppercase mb-1">Phase</p>
                <p className="text-sm font-bebas text-white">
                  {profile.activeProgram.currentWeek <= 4 ? 'Adaptation' :
                   profile.activeProgram.currentWeek <= 10 ? 'Développement' :
                   profile.activeProgram.currentWeek <= 16 ? 'Intensification' :
                   profile.activeProgram.currentWeek <= 20 ? 'Spécialisation' : 'Consolidation'}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-gray-500 uppercase mb-1">Focus Semaine</p>
                <p className="text-sm font-bebas text-white">
                  {profile.activeProgram.weeks.find(w => w.weekNumber === profile.activeProgram!.currentWeek)?.focus || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-4 flex-col">
          {!profile.activeProgram && userRole !== 'COACH' && (
            <button
              onClick={onCreateProgram}
              className="w-full py-6 bg-gray-800 text-white rounded-[2rem] font-bebas text-2xl hover:bg-gray-700 transition-all uppercase"
            >
              Créer Programme
            </button>
          )}
          {userRole === 'COACH' ? (
            <div className="space-y-3">
              {workout ? (
                <button
                  onClick={onEditWorkout}
                  className="w-full py-8 bg-red-600 text-white rounded-[2rem] font-bebas text-5xl hover:scale-105 transition-all uppercase border-2 border-red-400"
                >
                  ÉDITER LE PROTOCOLE
                </button>
              ) : (
                <button
                  onClick={onStartWorkout}
                  className="w-full py-8 bg-[var(--elite-yellow)] text-black rounded-[2rem] font-bebas text-5xl hover:scale-105 transition-all uppercase"
                >
                  {profile.activeProgram ? `GÉNÉRER SÉANCE ${profile.activeProgram.currentSession}` : 'GÉNÉRER PROTOCOLE'}
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onStartWorkout}
              className={`${profile.activeProgram ? 'w-full' : 'flex-1'} py-8 bg-[var(--elite-yellow)] text-black rounded-[2rem] font-bebas text-5xl hover:scale-105 transition-all uppercase`}
            >
              {profile.activeProgram ? `SÉANCE ${profile.activeProgram.currentSession}` : 'LANCER LE PROTOCOLE'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};





