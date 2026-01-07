import React, { useState, useEffect } from 'react';

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Bienvenue sur HYGIE ELITE',
    description: 'Découvrez comment utiliser l\'application pour optimiser vos séances d\'entraînement.',
    target: null
  },
  {
    id: 'daily_check',
    title: 'Page d\'Accueil',
    description: 'Ici vous pouvez voir votre objectif, votre programme actif et démarrer une nouvelle séance.',
    target: 'daily-check-card'
  },
  {
    id: 'workout',
    title: 'Pendant la Séance',
    description: 'Validez chaque série en ajustant le poids. Le timer vous guide pour l\'effort et le repos.',
    target: 'workout-card'
  },
  {
    id: 'dashboard',
    title: 'Statistiques',
    description: 'Consultez vos progrès, votre historique et vos métriques dans le dashboard.',
    target: 'stats-button'
  }
];

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentTutorial = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {TUTORIAL_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep ? 'bg-teal-500 w-8' : 
                  index < currentStep ? 'bg-teal-300 w-2' : 
                  'bg-gray-200 w-2'
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-2xl font-bebas text-gray-800 uppercase mb-2">
            {currentTutorial.title}
          </h3>
          <p className="text-gray-600 leading-relaxed">
            {currentTutorial.description}
          </p>
        </div>

        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 transition-all"
            >
              Précédent
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-full font-semibold hover:bg-teal-600 transition-all shadow-md hover:shadow-lg"
          >
            {isLastStep ? 'Terminer' : 'Suivant'}
          </button>
        </div>
      </div>
    </div>
  );
};


