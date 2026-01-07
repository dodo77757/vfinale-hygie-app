import React, { useState, useEffect } from 'react';
import { UserProfile, WeeklyProgram } from '../types';
import { StorageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { generateMultiWeekProgram } from '../services/programmingService';
import { AssignProgramModal } from './modals/AssignProgramModal';

interface ProgramManagerProps {
  clients: UserProfile[];
  onUpdate: (updatedClients: UserProfile[]) => void;
}

export const ProgramManager: React.FC<ProgramManagerProps> = ({
  clients,
  onUpdate
}) => {
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());

  // Récupérer tous les programmes actifs
  const activePrograms = clients
    .filter(c => c.activeProgram)
    .map(c => c.activeProgram!)
    .reduce((acc, program) => {
      if (!acc.find(p => p.id === program.id)) {
        acc.push(program);
      }
      return acc;
    }, [] as WeeklyProgram[]);

  const clientsByProgram = activePrograms.map(program => ({
    program,
    clients: clients.filter(c => c.activeProgram?.id === program.id)
  }));

  return (
    <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bebas text-2xl text-[#181818]">Gestion des Programmes</h3>
        <button
          onClick={() => setAssignModalOpen(true)}
          className="px-4 py-2 bg-[#007c89] text-white rounded-md text-sm font-semibold hover:bg-[#006a75] transition-all"
        >
          Assigner un programme
        </button>
      </div>

      {clientsByProgram.length === 0 ? (
        <div className="text-center py-12 text-[#6B7280]">
          <p className="text-sm">Aucun programme actif</p>
        </div>
      ) : (
        <div className="space-y-4">
          {clientsByProgram.map(({ program, clients: programClients }) => (
            <div
              key={program.id}
              className="p-4 bg-[#f3efe5] rounded-lg border border-[#007c89]/20"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-bebas text-lg text-[#181818]">{program.name}</h4>
                  <p className="text-xs text-[#6B7280] mt-1">
                    {program.duration} semaines • {program.sessionsPerWeek} sessions/semaine
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#007c89] bg-white px-2 py-1 rounded">
                  {programClients.length} client{programClients.length > 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
                  <span>Clients assignés:</span>
                  <span>{programClients.length}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {programClients.map(client => (
                    <span
                      key={client.id}
                      className="px-2 py-1 bg-white rounded text-xs text-[#181818]"
                    >
                      {client.nom}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AssignProgramModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        clients={clients}
        selectedClientIds={selectedClients}
        onUpdate={onUpdate}
      />
    </div>
  );
};

