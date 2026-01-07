import React from 'react';
import { ExerciseDefinition } from '../../data/exerciseLibrary';

interface ExerciseLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercises: ExerciseDefinition[];
  muscleGroup: string;
}

// Mapping des noms de parties du corps vers des noms lisibles
const BODY_PART_NAMES: Record<string, string> = {
  'pectoraux': 'Pectoraux',
  'deltoides': 'Deltoïdes',
  'trapezes': 'Trapèzes',
  'rhomboides': 'Rhomboïdes',
  'biceps': 'Biceps',
  'triceps': 'Triceps',
  'abdos': 'Abdominaux',
  'fessiers': 'Fessiers',
  'quadriceps': 'Quadriceps',
  'ischios': 'Ischio-jambiers',
  'mollets': 'Mollets',
  'adducteurs': 'Adducteurs',
  'tibial': 'Tibial antérieur',
  'peroniers': 'Péroniers',
  'coiffe': 'Coiffe des rotateurs',
  'denteles': 'Dentelés',
  'multifides': 'Multifides',
  'tfl': 'TFL',
  'stabilite': 'Stabilité',
};

export const ExerciseLibraryModal: React.FC<ExerciseLibraryModalProps> = ({
  isOpen,
  onClose,
  exercises,
  muscleGroup
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center backdrop-blur-md" onClick={onClose}>
      <div 
        className="bg-[#161616] border border-gray-800 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bebas text-3xl text-white tracking-widest mb-2">
              BIBLIOTHÈQUE D'EXERCICES
            </h2>
            <p className="text-sm font-mono text-[var(--primary-teal)] uppercase">
              {BODY_PART_NAMES[muscleGroup] || muscleGroup} • {exercises.length} exercice{exercises.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-2xl font-bold transition-colors"
          >
            ×
          </button>
        </div>

        {/* Exercises List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="bg-[#0d0d0d] border border-gray-800 rounded-xl p-4 hover:border-[var(--primary-teal)] transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bebas text-lg text-white uppercase tracking-wide">
                    {exercise.nom}
                  </h3>
                  <span className="text-xs font-mono text-gray-500 px-2 py-1 bg-gray-900 rounded">
                    {exercise.category}
                  </span>
                </div>
                
                <div className="mb-3">
                  <p className="text-xs font-mono text-gray-400 mb-1">Muscles ciblés:</p>
                  <div className="flex flex-wrap gap-1">
                    {exercise.target.map((muscle, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 bg-[var(--primary-teal)]/20 text-[var(--primary-teal)] rounded"
                      >
                        {muscle}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-gray-300 mb-2">{exercise.description}</p>
                
                {exercise.coach_tip && (
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <p className="text-xs font-mono text-[var(--primary-gold)] mb-1">💡 CONSEIL COACH:</p>
                    <p className="text-xs text-gray-400 italic">{exercise.coach_tip}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[var(--primary-teal)] text-black font-bebas uppercase tracking-wide rounded-lg hover:bg-[var(--primary-gold)] transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

