import React from 'react';
import { UserProfile } from '../types';
import { PerformanceBackground } from './shared/PerformanceBackground';

interface ClientLoginProps {
  clients: UserProfile[];
  onSelectClient: (client: UserProfile, mode: 'DASHBOARD' | 'DAILY_CHECK') => void;
  onBack: () => void;
}

export const ClientLogin: React.FC<ClientLoginProps> = ({ clients, onSelectClient, onBack }) => {
  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center bg-[#0d0d0d] p-6 relative overflow-y-auto custom-scrollbar">
      <PerformanceBackground />
      <div className="z-10 w-full max-w-4xl space-y-8 animate-fadeIn my-auto">
        <div className="text-center mb-10">
           <h2 className="font-bebas text-4xl md:text-6xl tracking-widest text-white leading-none mb-4">IDENTIFICATION REQUISE</h2>
           <p className="text-[12px] font-mono text-[var(--primary-teal)] tracking-[0.3em] uppercase animate-pulse">Sélectionnez votre profil vectoriel</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {clients.map((client) => (
              <div key={client.id} onClick={() => onSelectClient(client, 'DAILY_CHECK')} className="hud-card group p-6 rounded-[2rem] flex flex-col gap-4 cursor-pointer hover:bg-[#1a1a1a] transition-all hover:scale-[1.02] border-gray-800 relative">
                 <div className="flex items-center gap-6">
                     <img src={client.avatar} alt={client.nom} className="w-24 h-24 rounded-full border-2 border-[var(--primary-teal)] object-cover" />
                     <div>
                        <h3 className="font-bebas text-3xl text-white group-hover:text-[var(--primary-teal)]">{client.nom}</h3>
                        <p className="text-[10px] font-mono text-gray-500 uppercase">{client.objectifPrincipal}</p>
                     </div>
                 </div>
                 <div className="absolute top-6 right-6 text-gray-700 group-hover:text-[var(--primary-teal)] font-bebas text-2xl">⮕</div>
              </div>
           ))}
        </div>
        <button onClick={onBack} className="block mx-auto text-xs font-mono text-gray-600 hover:text-white uppercase">← Retour</button>
      </div>
    </div>
  );
};


