import React, { useState } from 'react';
import { UserProfile, WeeklyProgram } from '../../types';
import { StorageService } from '../../services/storageService';
import { notificationService } from '../../services/notificationService';
import { generateMultiWeekProgram } from '../../services/programmingService';
import { DataExportService } from '../../services/dataExportService';

interface BatchActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClients: Set<string>;
  clients: UserProfile[];
  onUpdate: (updatedClients: UserProfile[]) => void;
}

type BatchAction = 
  | 'assign-program'
  | 'modify-tags'
  | 'modify-objective'
  | 'archive'
  | 'export'
  | 'none';

export const BatchActionsModal: React.FC<BatchActionsModalProps> = ({
  isOpen,
  onClose,
  selectedClients,
  clients,
  onUpdate
}) => {
  const [selectedAction, setSelectedAction] = useState<BatchAction>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // État pour assigner un programme
  const [programName, setProgramName] = useState('');
  const [programDuration, setProgramDuration] = useState(24);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3);
  
  // État pour modifier les tags
  const [tagsToAdd, setTagsToAdd] = useState('');
  const [tagsToRemove, setTagsToRemove] = useState('');
  
  // État pour modifier l'objectif
  const [newObjective, setNewObjective] = useState('');
  
  if (!isOpen) return null;

  const selectedClientsList = clients.filter(c => selectedClients.has(c.id));
  const selectedCount = selectedClientsList.length;

  const handleAssignProgram = async () => {
    if (!programName.trim()) {
      notificationService.warning('Veuillez entrer un nom de programme');
      return;
    }

    setIsProcessing(true);
    try {
      const updatedClients: UserProfile[] = [];

      for (const client of selectedClientsList) {
        try {
          const program = await generateMultiWeekProgram(
            client,
            programDuration,
            sessionsPerWeek,
            programName
          );
          
          const updatedClient: UserProfile = {
            ...client,
            activeProgram: program
          };
          
          updatedClients.push(updatedClient);
        } catch (error) {
          console.error(`Erreur pour ${client.nom}:`, error);
        }
      }

      // Mettre à jour tous les clients
      let allClients = [...clients];
      updatedClients.forEach(updatedClient => {
        allClients = StorageService.updateClient(updatedClient);
      });

      onUpdate(allClients);
      notificationService.success(`Programme assigné à ${updatedClients.length} client(s)`);
      onClose();
      setSelectedAction('none');
      setProgramName('');
    } catch (error) {
      notificationService.error('Erreur lors de l\'assignation du programme');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModifyTags = () => {
    const tagsToAddList = tagsToAdd.split(',').map(t => t.trim()).filter(t => t);
    const tagsToRemoveList = tagsToRemove.split(',').map(t => t.trim()).filter(t => t);

    if (tagsToAddList.length === 0 && tagsToRemoveList.length === 0) {
      notificationService.warning('Veuillez spécifier au moins un tag à ajouter ou retirer');
      return;
    }

    let allClients = [...clients];
    
    selectedClientsList.forEach(client => {
      const currentTags = client.tags || [];
      
      // Ajouter les nouveaux tags
      const newTags = [...currentTags];
      tagsToAddList.forEach(tag => {
        if (!newTags.includes(tag)) {
          newTags.push(tag);
        }
      });
      
      // Retirer les tags spécifiés
      const finalTags = newTags.filter(tag => !tagsToRemoveList.includes(tag));
      
      const updatedClient: UserProfile = {
        ...client,
        tags: finalTags
      };
      
      allClients = StorageService.updateClient(updatedClient);
    });

    onUpdate(allClients);
    notificationService.success(`Tags modifiés pour ${selectedCount} client(s)`);
    onClose();
    setSelectedAction('none');
    setTagsToAdd('');
    setTagsToRemove('');
  };

  const handleModifyObjective = () => {
    if (!newObjective.trim()) {
      notificationService.warning('Veuillez entrer un objectif');
      return;
    }

    let allClients = [...clients];
    
    selectedClientsList.forEach(client => {
      const updatedClient: UserProfile = {
        ...client,
        objectifPrincipal: newObjective.trim()
      };
      
      allClients = StorageService.updateClient(updatedClient);
    });

    onUpdate(allClients);
    notificationService.success(`Objectif modifié pour ${selectedCount} client(s)`);
    onClose();
    setSelectedAction('none');
    setNewObjective('');
  };

  const handleArchive = () => {
    if (!window.confirm(`Archiver ${selectedCount} client(s) ?`)) {
      return;
    }

    let allClients = [...clients];
    
    selectedClientsList.forEach(client => {
      const updatedClient: UserProfile = {
        ...client,
        tags: [...(client.tags || []), 'ARCHIVÉ']
      };
      
      allClients = StorageService.updateClient(updatedClient);
    });

    onUpdate(allClients);
    notificationService.success(`${selectedCount} client(s) archivé(s)`);
    onClose();
    setSelectedAction('none');
  };

  const handleExport = () => {
    DataExportService.exportToJSON(clients, selectedClients);
    onClose();
    setSelectedAction('none');
  };

  const renderActionForm = () => {
    switch (selectedAction) {
      case 'assign-program':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#181818] mb-2">
                Nom du programme
              </label>
              <input
                type="text"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                placeholder="Ex: Programme Force 24 semaines"
                className="w-full bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#181818] mb-2">
                  Durée (semaines)
                </label>
                <input
                  type="number"
                  value={programDuration}
                  onChange={(e) => setProgramDuration(parseInt(e.target.value) || 24)}
                  min="1"
                  max="52"
                  className="w-full bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#181818] mb-2">
                  Sessions/semaine
                </label>
                <input
                  type="number"
                  value={sessionsPerWeek}
                  onChange={(e) => setSessionsPerWeek(parseInt(e.target.value) || 3)}
                  min="1"
                  max="7"
                  className="w-full bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
                />
              </div>
            </div>
            <button
              onClick={handleAssignProgram}
              disabled={isProcessing}
              className="w-full px-4 py-2 bg-[#007c89] text-white rounded-md text-sm font-semibold hover:bg-[#006a75] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Assignation en cours...' : `Assigner à ${selectedCount} client(s)`}
            </button>
          </div>
        );

      case 'modify-tags':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#181818] mb-2">
                Tags à ajouter (séparés par des virgules)
              </label>
              <input
                type="text"
                value={tagsToAdd}
                onChange={(e) => setTagsToAdd(e.target.value)}
                placeholder="Ex: Priorité, Suivi spécial"
                className="w-full bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#181818] mb-2">
                Tags à retirer (séparés par des virgules)
              </label>
              <input
                type="text"
                value={tagsToRemove}
                onChange={(e) => setTagsToRemove(e.target.value)}
                placeholder="Ex: Ancien tag"
                className="w-full bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
              />
            </div>
            <button
              onClick={handleModifyTags}
              className="w-full px-4 py-2 bg-[#007c89] text-white rounded-md text-sm font-semibold hover:bg-[#006a75] transition-all"
            >
              Modifier les tags
            </button>
          </div>
        );

      case 'modify-objective':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#181818] mb-2">
                Nouvel objectif
              </label>
              <input
                type="text"
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                placeholder="Ex: PRISE DE MASSE MUSCULAIRE"
                className="w-full bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
              />
            </div>
            <button
              onClick={handleModifyObjective}
              className="w-full px-4 py-2 bg-[#007c89] text-white rounded-md text-sm font-semibold hover:bg-[#006a75] transition-all"
            >
              Modifier l'objectif
            </button>
          </div>
        );

      case 'archive':
        return (
          <div className="space-y-4">
            <p className="text-sm text-[#6B7280]">
              Les clients seront marqués avec le tag "ARCHIVÉ". Vous pourrez les filtrer ou les réactiver plus tard.
            </p>
            <button
              onClick={handleArchive}
              className="w-full px-4 py-2 bg-[#EF4444] text-white rounded-md text-sm font-semibold hover:bg-[#DC2626] transition-all"
            >
              Archiver {selectedCount} client(s)
            </button>
          </div>
        );

      case 'export':
        return (
          <div className="space-y-4">
            <p className="text-sm text-[#6B7280]">
              Les {selectedCount} client(s) sélectionné(s) seront exportés au format JSON.
            </p>
            <button
              onClick={handleExport}
              className="w-full px-4 py-2 bg-[#007c89] text-white rounded-md text-sm font-semibold hover:bg-[#006a75] transition-all"
            >
              Exporter en JSON
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-[#181818]/80 flex items-center justify-center p-4 backdrop-blur-md" onClick={onClose}>
      <div 
        className="bg-white border border-[#007c89]/20 rounded-lg w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#007c89]/20 p-4">
          <h2 className="font-bebas text-xl text-[#181818]">Actions en lot</h2>
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#181818] text-xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="text-sm text-[#6B7280]">
            <span className="font-semibold text-[#007c89]">{selectedCount}</span> client(s) sélectionné(s)
          </div>

          {/* Sélection de l'action */}
          <div>
            <label className="block text-sm font-semibold text-[#181818] mb-2">
              Choisir une action
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value as BatchAction)}
              className="w-full bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
            >
              <option value="none">-- Sélectionner une action --</option>
              <option value="assign-program">Assigner un programme</option>
              <option value="modify-tags">Modifier les tags</option>
              <option value="modify-objective">Modifier l'objectif</option>
              <option value="archive">Archiver</option>
              <option value="export">Exporter</option>
            </select>
          </div>

          {/* Formulaire de l'action */}
          {selectedAction !== 'none' && (
            <div className="border-t border-[#007c89]/20 pt-4">
              {renderActionForm()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

