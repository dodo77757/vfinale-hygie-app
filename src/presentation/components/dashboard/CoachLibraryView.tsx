import React from 'react';
import { HumanBodySVG } from '../../../../components/HumanBodySVG';

interface CoachLibraryViewProps {
  onBodyPartClick: (part: string) => void;
}

export const CoachLibraryView: React.FC<CoachLibraryViewProps> = ({
  onBodyPartClick
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="font-bebas text-4xl text-[#1F2937] mb-2">Bibliothèque d'Exercices</h1>
        <p className="text-sm text-[#6B7280] font-medium">Sélectionnez une partie du corps pour explorer les exercices</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-12 flex flex-col items-center justify-center min-h-[600px]">
        <div className="mb-6">
          <p className="text-sm text-[#6B7280] text-center mb-4">Cliquez sur une partie du corps</p>
          <HumanBodySVG onBodyPartClick={onBodyPartClick} />
        </div>
      </div>
    </div>
  );
};

