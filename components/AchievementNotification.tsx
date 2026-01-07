import React, { useEffect } from 'react';
import { Achievement } from '../types';

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  onClose
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[200] animate-fadeIn">
      <div className="bg-gradient-to-br from-[#FCD34D] via-[#FBBF24] to-[#F59E0B] p-6 rounded-2xl border-4 border-[#F97316] shadow-2xl max-w-md">
        <div className="flex items-center gap-4">
          <div className="text-6xl animate-bounce">
            {achievement.icon}
          </div>
          <div className="flex-1">
            <h3 className="font-bebas text-2xl text-[#1F2937] mb-1 uppercase">
              Achievement Débloqué !
            </h3>
            <p className="font-semibold text-[#1F2937] text-lg mb-1">
              {achievement.name}
            </p>
            <p className="text-sm text-[#4B5563]">
              {achievement.description}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center">
          <div className="w-full bg-[#FED7AA] rounded-full h-2">
            <div className="bg-gradient-to-r from-[#F97316] to-[#F59E0B] h-2 rounded-full animate-pulse" style={{ width: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  );
};


