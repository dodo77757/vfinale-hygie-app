import React, { useState } from 'react';
import { UserProfile, UserPreferences } from '../../../../types';
import { ClientSettings } from '../../../../components/ClientSettings';
import { StorageService } from '../../../../services/storageService';

interface ClientProfileProps {
  profile: UserProfile;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
}

export const ClientProfile: React.FC<ClientProfileProps> = ({
  profile,
  onUpdateProfile
}) => {
  const [showSettings, setShowSettings] = useState(false);

  const handleSavePreferences = (preferences: UserPreferences) => {
    const updatedProfile: UserProfile = {
      ...profile,
      preferences
    };
    const updatedClients = StorageService.updateClient(updatedProfile);
    onUpdateProfile(updatedProfile);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Profil Header */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8">
        <div className="flex items-center gap-6 mb-6">
          <img
            src={profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.nom || '')}&background=007c89&color=fff&size=200`}
            alt={profile?.nom}
            className="w-20 h-20 rounded-full border-2 border-[#007c89]/30 object-cover"
          />
          <div>
            <h2 className="text-3xl font-bebas text-[#1F2937] mb-1">{profile?.nom}</h2>
            <p className="text-sm font-medium text-[#007c89] uppercase">{profile?.objectifPrincipal || 'Objectif non défini'}</p>
          </div>
        </div>

        {/* Informations biométriques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
            <p className="text-xs font-semibold text-[#6B7280] uppercase mb-2">Âge</p>
            <p className="text-xl font-bebas text-[#1F2937]">{profile?.age || 'N/A'}</p>
          </div>
          <div className="p-4 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
            <p className="text-xs font-semibold text-[#6B7280] uppercase mb-2">Taille</p>
            <p className="text-xl font-bebas text-[#1F2937]">{profile?.taille ? `${profile.taille} cm` : 'N/A'}</p>
          </div>
          <div className="p-4 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
            <p className="text-xs font-semibold text-[#6B7280] uppercase mb-2">Poids</p>
            <p className="text-xl font-bebas text-[#1F2937]">{profile?.poids ? `${profile.poids} kg` : 'N/A'}</p>
          </div>
          <div className="p-4 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
            <p className="text-xs font-semibold text-[#6B7280] uppercase mb-2">Niveau</p>
            <p className="text-xl font-bebas text-[#1F2937]">{profile?.experience || 'N/A'}</p>
          </div>
        </div>

        {/* Blessures actives */}
        {profile?.blessures_actives && profile.blessures_actives.length > 0 && (
          <div className="p-4 rounded-lg bg-[#FEF2F2] border border-[#FEE2E2]">
            <p className="text-xs font-semibold text-[#DC2626] uppercase mb-2">Blessures Actives</p>
            <div className="flex flex-wrap gap-2">
              {profile.blessures_actives.map((injury, idx) => (
                <span key={idx} className="px-3 py-1 bg-[#FEE2E2] text-[#DC2626] rounded-full text-xs font-semibold">
                  {injury}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bouton Paramètres */}
        <button
          onClick={() => setShowSettings(true)}
          className="w-full mt-6 py-4 bg-[#007c89] text-white rounded-xl font-bebas text-lg hover:bg-[#006a75] transition-all shadow-md hover:shadow-lg"
        >
          Paramètres
        </button>
      </div>

      {/* Journal de récupération récent */}
      {profile?.recoveryJournal && profile.recoveryJournal.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
          <p className="text-xs font-semibold text-[#007c89] uppercase mb-4 tracking-wider">Journal de Récupération</p>
          <div className="space-y-3">
            {profile.recoveryJournal.slice(-5).reverse().map((entry, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                <p className="text-xs font-semibold text-[#6B7280] mb-2">
                  {new Date(entry.date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {entry.sleepHours && (
                    <div>
                      <span className="text-[#6B7280]">Sommeil: </span>
                      <span className="font-semibold text-[#1F2937]">{entry.sleepHours}h</span>
                    </div>
                  )}
                  {entry.energyLevel && (
                    <div>
                      <span className="text-[#6B7280]">Énergie: </span>
                      <span className="font-semibold text-[#1F2937]">{entry.energyLevel}/10</span>
                    </div>
                  )}
                </div>
                {entry.notes && (
                  <p className="text-sm text-[#6B7280] mt-2 italic">{entry.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Paramètres */}
      {showSettings && (
        <ClientSettings
          profile={profile}
          onSave={handleSavePreferences}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

