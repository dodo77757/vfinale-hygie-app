import React, { useState } from 'react';
import { WorkoutPlan, Exercise } from '../types';

interface WorkoutEditorProps {
  workout: WorkoutPlan;
  onSave: (editedWorkout: WorkoutPlan) => void;
  onCancel: () => void;
}

export const WorkoutEditor: React.FC<WorkoutEditorProps> = ({ workout, onSave, onCancel }) => {
  const [editedExercises, setEditedExercises] = useState<Exercise[]>(workout.liste_exos);

  const updateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    const updated = [...editedExercises];
    updated[index] = { ...updated[index], [field]: value };
    setEditedExercises(updated);
  };

  const handleSave = () => {
    const editedWorkout: WorkoutPlan = {
      ...workout,
      liste_exos: editedExercises
    };
    onSave(editedWorkout);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
      <div className="hud-card w-full max-w-4xl rounded-[2rem] p-8 bg-[#121212] space-y-6 border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-bebas text-3xl text-white">ÉDITION DU PROTOCOLE</h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {editedExercises.map((exo, index) => (
            <div key={index} className="bg-black/50 border border-gray-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bebas text-xl text-white">{exo.nom}</h4>
                <span className="text-[10px] font-mono text-gray-500">Exo {index + 1}/{editedExercises.length}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p className="text-[9px] font-mono text-gray-500 uppercase mb-1">Nom</p>
                  <input
                    value={exo.nom}
                    onChange={(e) => updateExercise(index, 'nom', e.target.value)}
                    className="w-full bg-black/50 border border-gray-700 rounded-lg p-2 text-sm text-white focus:border-[var(--primary-teal)] outline-none"
                  />
                </div>
                <div>
                  <p className="text-[9px] font-mono text-gray-500 uppercase mb-1">Séries</p>
                  <input
                    type="number"
                    value={exo.sets}
                    onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 1)}
                    className="w-full bg-black/50 border border-gray-700 rounded-lg p-2 text-sm text-white focus:border-[var(--primary-teal)] outline-none"
                    min="1"
                  />
                </div>
                <div>
                  <p className="text-[9px] font-mono text-gray-500 uppercase mb-1">Reps</p>
                  <input
                    value={exo.reps}
                    onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                    className="w-full bg-black/50 border border-gray-700 rounded-lg p-2 text-sm text-white focus:border-[var(--primary-teal)] outline-none"
                    placeholder="10-12"
                  />
                </div>
                <div>
                  <p className="text-[9px] font-mono text-gray-500 uppercase mb-1">Poids (kg)</p>
                  <input
                    value={exo.poids_suggere || ''}
                    onChange={(e) => updateExercise(index, 'poids_suggere', e.target.value)}
                    className="w-full bg-black/50 border border-gray-700 rounded-lg p-2 text-sm text-white focus:border-[var(--primary-teal)] outline-none"
                    placeholder="50kg"
                  />
                </div>
              </div>

              <div>
                <p className="text-[9px] font-mono text-gray-500 uppercase mb-1">Description</p>
                <textarea
                  value={exo.description}
                  onChange={(e) => updateExercise(index, 'description', e.target.value)}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg p-2 text-xs text-gray-300 font-mono focus:border-[var(--elite-yellow)] outline-none resize-none"
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <p className="text-[9px] font-mono text-gray-500 uppercase mb-1">Repos (sec)</p>
                  <input
                    type="number"
                    value={exo.repos}
                    onChange={(e) => updateExercise(index, 'repos', parseInt(e.target.value) || 60)}
                    className="w-full bg-black/50 border border-gray-700 rounded-lg p-2 text-sm text-white focus:border-[var(--primary-teal)] outline-none"
                    min="0"
                  />
                </div>
                {exo.coach_tip && (
                  <div className="flex-1">
                    <p className="text-[9px] font-mono text-gray-500 uppercase mb-1">Conseil Coach</p>
                    <input
                      value={exo.coach_tip}
                      onChange={(e) => updateExercise(index, 'coach_tip', e.target.value)}
                      className="w-full bg-black/50 border border-gray-700 rounded-lg p-2 text-xs text-gray-300 focus:border-[var(--elite-yellow)] outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 pt-4 border-t border-gray-800">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-900 text-gray-500 rounded-xl font-bebas uppercase hover:text-white"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-[var(--primary-gold)] text-black rounded-xl font-bebas text-xl uppercase hover:bg-amber-500"
          >
            Sauvegarder Modifications
          </button>
        </div>
      </div>
    </div>
  );
};

