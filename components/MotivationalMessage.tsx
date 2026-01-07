import React from 'react';

interface MotivationalMessageProps {
  type: 'mid_session' | 'last_exercise' | 'pr_broken' | 'streak' | 'progress';
  message?: string;
}

const MESSAGES: Record<string, string> = {
  mid_session: 'Excellent travail ! Vous êtes à mi-parcours 💪',
  last_exercise: 'Dernier exercice, vous y êtes presque ! 🔥',
  pr_broken: 'Nouveau record personnel ! 🏆',
  streak: 'Série impressionnante ! Continuez comme ça ! ⚡',
  progress: 'Belle progression ! Vous avancez vers votre objectif 📈'
};

export const MotivationalMessage: React.FC<MotivationalMessageProps> = ({
  type,
  message
}) => {
  const displayMessage = message || MESSAGES[type] || '';

  if (!displayMessage) return null;

  return (
    <div className="fixed top-24 right-6 z-[100] animate-fadeIn">
      <div className="bg-gradient-to-r from-[#BAE6FD] to-[#7DD3FC] px-4 py-3 rounded-xl border-2 border-[#38BDF8] shadow-lg">
        <p className="text-sm font-semibold text-[#1F2937] whitespace-nowrap">
          {displayMessage}
        </p>
      </div>
    </div>
  );
};


