import React from 'react';

interface CoachSettingsViewProps {
  onImport: () => void;
}

export const CoachSettingsView: React.FC<CoachSettingsViewProps> = ({
  onImport
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="font-bebas text-4xl text-[#1F2937] mb-2">Paramètres</h1>
        <p className="text-sm text-[#6B7280] font-medium">Gestion de l'application</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 space-y-6">
        <div>
          <h2 className="font-bebas text-2xl text-[#1F2937] mb-4">Import de données</h2>
          <button
            onClick={onImport}
            className="px-6 py-3 bg-[#007c89] text-white rounded-xl font-semibold hover:bg-[#006a75] transition-all shadow-sm hover:shadow-md"
          >
            Importer depuis JSON
          </button>
        </div>

        {/* Autres paramètres à venir */}
        <div className="pt-6 border-t border-[#E5E7EB]">
          <h2 className="font-bebas text-2xl text-[#1F2937] mb-4">Autres paramètres</h2>
          <p className="text-sm text-[#6B7280]">Fonctionnalités à venir...</p>
        </div>
      </div>
    </div>
  );
};

