import React, { useState } from 'react';
import { UserProfile, UserPreferences } from '../types';

interface ClientSettingsProps {
  profile: UserProfile;
  onSave: (preferences: UserPreferences) => void;
  onClose: () => void;
}

export const ClientSettings: React.FC<ClientSettingsProps> = ({
  profile,
  onSave,
  onClose
}) => {
  const [preferences, setPreferences] = useState<UserPreferences>(
    profile.preferences || {
      fontSize: 'medium',
      highContrast: false,
      notificationsEnabled: true,
      notificationFrequency: 'daily',
      language: 'fr',
      theme: 'light'
    }
  );

  const handleSave = () => {
    onSave(preferences);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bebas text-gray-800 uppercase">Paramètres</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Affichage */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Affichage</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Taille de police
                </label>
                <div className="flex gap-3">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setPreferences({ ...preferences, fontSize: size })}
                      className={`flex-1 py-2 rounded-xl font-semibold transition-all ${
                        preferences.fontSize === size
                          ? 'bg-teal-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {size === 'small' ? 'Petite' : size === 'medium' ? 'Moyenne' : 'Grande'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Contraste élevé</p>
                  <p className="text-xs text-gray-600">Améliore la lisibilité</p>
                </div>
                <button
                  onClick={() => setPreferences({ ...preferences, highContrast: !preferences.highContrast })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    preferences.highContrast ? 'bg-teal-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    preferences.highContrast ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Activer les notifications</p>
                  <p className="text-xs text-gray-600">Recevoir des rappels et des mises à jour</p>
                </div>
                <button
                  onClick={() => setPreferences({ ...preferences, notificationsEnabled: !preferences.notificationsEnabled })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    preferences.notificationsEnabled ? 'bg-teal-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    preferences.notificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {preferences.notificationsEnabled && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fréquence
                  </label>
                  <div className="flex gap-3">
                    {(['daily', 'weekly', 'never'] as const).map((freq) => (
                      <button
                        key={freq}
                        onClick={() => setPreferences({ ...preferences, notificationFrequency: freq })}
                        className={`flex-1 py-2 rounded-xl font-semibold transition-all ${
                          preferences.notificationFrequency === freq
                            ? 'bg-teal-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {freq === 'daily' ? 'Quotidien' : freq === 'weekly' ? 'Hebdomadaire' : 'Jamais'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Langue */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Langue</h3>
            <select
              value={preferences.language || 'fr'}
              onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-teal-500 text-white rounded-full font-semibold hover:bg-teal-600 transition-all shadow-md hover:shadow-lg"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};


