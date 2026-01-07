import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { StorageService } from '../../services/storageService';
import { notificationService } from '../../services/notificationService';

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: UserProfile | null;
  onUpdate: (updatedClient: UserProfile) => void;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({
  isOpen,
  onClose,
  client,
  onUpdate
}) => {
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (client) {
      setFormData({
        nom: client.nom || '',
        age: client.age || 0,
        genre: client.genre || '',
        poids: client.poids || '',
        taille: client.taille || '',
        experience: client.experience || 'Débutant',
        stressLevel: client.stressLevel || 'Moyen',
        sleepQuality: client.sleepQuality || 'Moyenne',
        objectifPrincipal: client.objectifPrincipal || '',
        delaiObjectif: client.delaiObjectif || '',
        materiel: client.materiel || '',
        private_notes: client.private_notes || '',
        tags: client.tags || [],
      });
    }
  }, [client]);

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(tag => tag !== tagToRemove) || []
    });
  };

  if (!isOpen || !client) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedClient: UserProfile = {
      ...client,
      ...formData,
    };

    const updatedClients = StorageService.updateClient(updatedClient);
    onUpdate(updatedClient);
    notificationService.success("Informations client mises à jour.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-[#181818]/80 flex items-center justify-center backdrop-blur-md" onClick={onClose}>
      <div 
        className="bg-white border border-[#007c89]/20 rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Style Hygie */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bebas text-3xl text-[#007c89] tracking-widest mb-2">
              ÉDITION CLIENT
            </h2>
            <p className="text-sm font-semibold text-[#181818] uppercase">
              {client.nom}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#181818] text-2xl font-bold transition-colors"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nom */}
            <div>
              <label className="text-xs font-semibold text-[#181818] uppercase mb-2 block">Nom</label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full bg-white border border-[#007c89]/30 rounded-md p-3 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20 transition-all"
                required
              />
            </div>

            {/* Âge */}
            <div>
              <label className="text-xs font-semibold text-[#181818] uppercase mb-2 block">Âge</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                className="w-full bg-white border border-[#007c89]/30 rounded-md p-3 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20 transition-all"
                min="0"
                max="120"
                required
              />
            </div>

            {/* Genre */}
            <div>
              <label className="text-xs font-semibold text-[#181818] uppercase mb-2 block">Genre</label>
              <select
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full bg-white border border-[#007c89]/30 rounded-md p-3 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20 transition-all"
                required
              >
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            {/* Poids */}
            <div>
              <label className="text-xs font-semibold text-[#181818] uppercase mb-2 block">Poids (kg)</label>
              <input
                type="text"
                value={formData.poids}
                onChange={(e) => setFormData({ ...formData, poids: e.target.value })}
                className="w-full bg-white border border-[#007c89]/30 rounded-md p-3 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20 transition-all"
                placeholder="70"
              />
            </div>

            {/* Taille */}
            <div>
              <label className="text-xs font-semibold text-[#181818] uppercase mb-2 block">Taille (cm)</label>
              <input
                type="text"
                value={formData.taille}
                onChange={(e) => setFormData({ ...formData, taille: e.target.value })}
                className="w-full bg-white border border-[#007c89]/30 rounded-md p-3 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20 transition-all"
                placeholder="175"
              />
            </div>

            {/* Expérience */}
            <div>
              <label className="text-xs font-semibold text-[#181818] uppercase mb-2 block">Expérience</label>
              <select
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value as 'Débutant' | 'Intermédiaire' | 'Avancé' })}
                className="w-full bg-white border border-[#007c89]/30 rounded-md p-3 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20 transition-all"
              >
                <option value="Débutant">Débutant</option>
                <option value="Intermédiaire">Intermédiaire</option>
                <option value="Avancé">Avancé</option>
              </select>
            </div>

            {/* Niveau de stress */}
            <div>
              <label className="text-xs font-semibold text-[#181818] uppercase mb-2 block">Niveau de stress</label>
              <select
                value={formData.stressLevel}
                onChange={(e) => setFormData({ ...formData, stressLevel: e.target.value as 'Bas' | 'Moyen' | 'Élevé' })}
                className="w-full bg-white border border-[#007c89]/30 rounded-md p-3 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20 transition-all"
              >
                <option value="Bas">Bas</option>
                <option value="Moyen">Moyen</option>
                <option value="Élevé">Élevé</option>
              </select>
            </div>

            {/* Qualité de sommeil */}
            <div>
              <label className="text-xs font-semibold text-[#181818] uppercase mb-2 block">Qualité de sommeil</label>
              <select
                value={formData.sleepQuality}
                onChange={(e) => setFormData({ ...formData, sleepQuality: e.target.value as 'Mauvaise' | 'Moyenne' | 'Excellente' })}
                className="w-full bg-white border border-[#007c89]/30 rounded-md p-3 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20 transition-all"
              >
                <option value="Mauvaise">Mauvaise</option>
                <option value="Moyenne">Moyenne</option>
                <option value="Excellente">Excellente</option>
              </select>
            </div>

            {/* Objectif principal */}
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-[#181818] uppercase mb-2 block">Objectif principal</label>
              <input
                type="text"
                value={formData.objectifPrincipal}
                onChange={(e) => setFormData({ ...formData, objectifPrincipal: e.target.value })}
                className="w-full bg-white border border-[#007c89]/30 rounded-md p-3 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20 transition-all"
                placeholder="Perte de poids, Prise de masse, etc."
              />
            </div>

            {/* Délai objectif */}
            <div>
              <label className="text-xs font-semibold text-[#181818] uppercase mb-2 block">Délai objectif</label>
              <input
                type="text"
                value={formData.delaiObjectif}
                onChange={(e) => setFormData({ ...formData, delaiObjectif: e.target.value })}
                className="w-full bg-white border border-[#007c89]/30 rounded-md p-3 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20 transition-all"
                placeholder="3 mois"
              />
            </div>

            {/* Matériel */}
            <div>
              <label className="text-xs font-semibold text-[#181818] uppercase mb-2 block">Matériel disponible</label>
              <input
                type="text"
                value={formData.materiel}
                onChange={(e) => setFormData({ ...formData, materiel: e.target.value })}
                className="w-full bg-white border border-[#007c89]/30 rounded-md p-3 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20 transition-all"
                placeholder="Haltères, Barre, etc."
              />
            </div>

            {/* Tags */}
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-[#181818] uppercase mb-2 block">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags?.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-[#e0f4f6] text-[#007c89] rounded-md text-xs font-semibold uppercase flex items-center gap-2 border border-[#007c89]/30"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-[#007c89] hover:text-[#EF4444] transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="flex-1 bg-white border border-[#007c89]/30 rounded-md p-3 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20 transition-all"
                  placeholder="Ajouter un tag (ex: VIP, Priorité, Nouveau...)"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-[#007c89] text-white font-bebas uppercase tracking-wide rounded-md hover:bg-[#006a75] transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Notes privées */}
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-[#181818] uppercase mb-2 block">Notes privées</label>
              <textarea
                value={formData.private_notes || ''}
                onChange={(e) => setFormData({ ...formData, private_notes: e.target.value })}
                className="w-full bg-white border border-[#007c89]/30 rounded-md p-3 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20 transition-all resize-none h-24"
                placeholder="Notes privées que le client ne verra pas..."
              />
            </div>
          </div>

          {/* Footer - Style Hygie */}
          <div className="mt-6 pt-4 border-t border-[#007c89]/20 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-white border border-[#007c89]/30 text-[#181818] font-bebas uppercase tracking-wide rounded-md hover:bg-[#f3efe5] transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#007c89] text-white font-bebas uppercase tracking-wide rounded-md hover:bg-[#006a75] transition-colors"
            >
              Sauvegarder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

