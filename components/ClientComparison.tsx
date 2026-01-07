import React, { useState } from 'react';
import { UserProfile } from '../types';
import { EnhancedLineChart, EnhancedAreaChart } from './ui/EnhancedChart';

interface ClientComparisonProps {
  clients: UserProfile[];
  onClose?: () => void;
}

export const ClientComparison: React.FC<ClientComparisonProps> = ({
  clients,
  onClose
}) => {
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  const selectedClientsData = clients.filter(c => selectedClients.includes(c.id));

  const volumeData = selectedClientsData.map(client => ({
    name: client.nom,
    data: (client.historique_dates || []).map((date, i) => ({
      date,
      value: (client.historique_volume || [])[i] || 0
    }))
  }));

  const progressData = selectedClientsData.map(client => ({
    name: client.nom,
    data: (client.activeGoal?.history || []).map(entry => ({
      date: entry.date,
      value: entry.value
    }))
  }));

  return (
    <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bebas text-2xl text-[#181818]">Comparaison de Clients</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#181818] text-xl"
          >
            ✕
          </button>
        )}
      </div>

      {/* Sélection des clients */}
      <div>
        <label className="block text-sm font-semibold text-[#181818] mb-2">
          Sélectionner 2-4 clients à comparer
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
          {clients.map(client => (
            <label
              key={client.id}
              className={`flex items-center gap-2 p-2 border rounded-md cursor-pointer transition-all ${
                selectedClients.includes(client.id)
                  ? 'border-[#007c89] bg-[#e0f4f6]'
                  : 'border-[#007c89]/30 hover:bg-[#f3efe5]'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedClients.includes(client.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    if (selectedClients.length < 4) {
                      setSelectedClients([...selectedClients, client.id]);
                    }
                  } else {
                    setSelectedClients(selectedClients.filter(id => id !== client.id));
                  }
                }}
                className="text-[#007c89]"
                disabled={!selectedClients.includes(client.id) && selectedClients.length >= 4}
              />
              <span className="text-sm text-[#181818] truncate">{client.nom}</span>
            </label>
          ))}
        </div>
      </div>

      {selectedClientsData.length > 0 && (
        <>
          {/* Métriques comparatives */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {selectedClientsData.map(client => (
              <div key={client.id} className="p-4 bg-[#f3efe5] rounded-lg border border-[#007c89]/20">
                <h4 className="font-bebas text-lg text-[#181818] mb-3">{client.nom}</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-[#6B7280]">Sessions:</span>
                    <span className="ml-2 font-semibold text-[#181818]">
                      {client.sessionRecords?.length || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280]">Progression:</span>
                    <span className="ml-2 font-semibold text-[#181818]">
                      {Math.round(client.activeGoal?.currentValue || 0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280]">Volume total:</span>
                    <span className="ml-2 font-semibold text-[#181818]">
                      {Math.round((client.historique_volume?.reduce((a, b) => a + b, 0) || 0) / 1000)}k kg
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280]">Objectif:</span>
                    <span className="ml-2 font-semibold text-[#181818] text-xs">
                      {client.objectifPrincipal || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Graphiques comparatifs */}
          {volumeData.some(d => d.data.length > 0) && (
            <div className="p-4 bg-white border border-[#007c89]/20 rounded-lg">
              <h4 className="font-bebas text-lg text-[#181818] mb-4">Évolution du Volume</h4>
              <div className="h-64">
                <EnhancedAreaChart
                  data={volumeData.flatMap(d => d.data.map(item => ({ date: item.date, v: item.value })))}
                  title=""
                />
              </div>
            </div>
          )}

          {progressData.some(d => d.data.length > 0) && (
            <div className="p-4 bg-white border border-[#007c89]/20 rounded-lg">
              <h4 className="font-bebas text-lg text-[#181818] mb-4">Progression des Objectifs</h4>
              <div className="h-64">
                <EnhancedLineChart
                  data={progressData.flatMap(d => d.data)}
                  title=""
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

