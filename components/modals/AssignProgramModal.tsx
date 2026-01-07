import React, { useState } from 'react';
import { UserProfile, WeeklyProgram } from '../../types';
import { StorageService } from '../../services/storageService';
import { notificationService } from '../../services/notificationService';
import { generateMultiWeekProgram } from '../../services/programmingService';

interface AssignProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: UserProfile[];
  selectedClientIds?: Set<string>;
  onUpdate: (updatedClients: UserProfile[]) => void;
}

export const AssignProgramModal: React.FC<AssignProgramModalProps> = ({
  isOpen,
  onClose,
  clients,
  selectedClientIds,
  onUpdate
}) => {
  const [programName, setProgramName] = useState('');
  const [duration, setDuration] = useState(24);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedClientsForProgram, setSelectedClientsForProgram] = useState<Set<string>>(
    selectedClientIds || new Set()
  );

  if (!isOpen) return null;

  const handleAssign = async () => {
    if (!programName.trim()) {
      notificationService.warning('Veuillez entrer un nom de programme');
      return;
    }

    if (selectedClientsForProgram.size === 0) {
      notificationService.warning('Veuillez sélectionner au moins un client');
      return;
    }

    setIsProcessing(true);
    try {
      const clientsToUpdate = clients.filter(c => selectedClientsForProgram.has(c.id));
      const updatedClients: UserProfile[] = [];

      for (const client of clientsToUpdate) {
        try {
          const program = await generateMultiWeekProgram(
            client,
            duration,
            sessionsPerWeek,
            programName
          );
          
          updatedClients.push({
            ...client,
            activeProgram: program
          });
        } catch (error) {
          console.error(`Erreur pour ${client.nom}:`, error);
        }
      }

      let allClients = [...clients];
      updatedClients.forEach(updatedClient => {
        allClients = StorageService.updateClient(updatedClient);
      });

      onUpdate(allClients);
      notificationService.success(`Programme assigné à ${updatedClients.length} client(s)`);
      onClose();
      setProgramName('');
      setSelectedClientsForProgram(new Set());
    } catch (error) {
      notificationService.error('Erreur lors de l\'assignation du programme');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-[#181818]/80 flex items-center justify-center p-4 backdrop-blur-md" onClick={onClose}>
      <div 
        className="bg-white border border-[#007c89]/20 rounded-lg w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#007c89]/20 p-4">
          <h2 className="font-bebas text-xl text-[#181818]">Assigner un programme</h2>
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#181818] text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
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
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 24)}
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

          <div>
            <label className="block text-sm font-semibold text-[#181818] mb-2">
              Clients ({selectedClientsForProgram.size} sélectionné{selectedClientsForProgram.size > 1 ? 's' : ''})
            </label>
            <div className="max-h-48 overflow-y-auto border border-[#007c89]/30 rounded-md p-2 custom-scrollbar">
              {clients.map(client => (
                <label key={client.id} className="flex items-center gap-2 p-2 hover:bg-[#f3efe5] rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedClientsForProgram.has(client.id)}
                    onChange={(e) => {
                      const newSet = new Set(selectedClientsForProgram);
                      if (e.target.checked) {
                        newSet.add(client.id);
                      } else {
                        newSet.delete(client.id);
                      }
                      setSelectedClientsForProgram(newSet);
                    }}
                    className="text-[#007c89]"
                  />
                  <span className="text-sm text-[#181818]">{client.nom}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#007c89]/20">
            <button
              onClick={handleAssign}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-[#007c89] text-white rounded-md text-sm font-semibold hover:bg-[#006a75] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Assignation...' : 'Assigner'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white text-[#181818] border border-[#007c89]/30 rounded-md text-sm font-semibold hover:bg-[#f3efe5] transition-all"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

