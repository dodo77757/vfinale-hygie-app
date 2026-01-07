import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface ModeratorDashboardProps {
  clients: UserProfile[];
}

type WidgetType = 'stats' | 'alerts' | 'recent' | 'chart';

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  position: number;
}

const STORAGE_KEY = 'hygie_moderator_dashboard_layout';

export const ModeratorDashboard: React.FC<ModeratorDashboardProps> = ({
  clients
}) => {
  const [widgets, setWidgets] = useState<Widget[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    
    // Layout par défaut
    return [
      { id: 'w1', type: 'stats', title: 'Statistiques', position: 0 },
      { id: 'w2', type: 'alerts', title: 'Alertes', position: 1 },
      { id: 'w3', type: 'recent', title: 'Clients récents', position: 2 }
    ];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  }, [widgets]);

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'stats':
        return (
          <div className="p-4 bg-white border border-[#007c89]/20 rounded-lg shadow-md">
            <h4 className="font-bebas text-lg text-[#181818] mb-3">{widget.title}</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-[#6B7280] uppercase mb-1">Clients</div>
                <div className="font-bebas text-2xl text-[#181818]">{clients.length}</div>
              </div>
              <div>
                <div className="text-xs text-[#6B7280] uppercase mb-1">Sessions</div>
                <div className="font-bebas text-2xl text-[#181818]">
                  {clients.reduce((sum, c) => sum + (c.sessionRecords?.length || 0), 0)}
                </div>
              </div>
            </div>
          </div>
        );

      case 'alerts':
        const alertCount = clients.filter(c => 
          (c.lastPainReport && c.lastPainReport.intensity >= 5) ||
          (c.sleepQuality === 'Mauvaise') ||
          (c.blessures_actives && c.blessures_actives.length > 0)
        ).length;
        
        return (
          <div className="p-4 bg-white border border-[#007c89]/20 rounded-lg shadow-md">
            <h4 className="font-bebas text-lg text-[#181818] mb-3">{widget.title}</h4>
            <div className="text-center">
              <div className="font-bebas text-3xl text-[#EF4444]">{alertCount}</div>
              <div className="text-xs text-[#6B7280] mt-1">Alertes actives</div>
            </div>
          </div>
        );

      case 'recent':
        const recentClients = clients
          .filter(c => c.sessionRecords && c.sessionRecords.length > 0)
          .sort((a, b) => {
            const aLast = new Date(a.sessionRecords![a.sessionRecords!.length - 1].date).getTime();
            const bLast = new Date(b.sessionRecords![b.sessionRecords!.length - 1].date).getTime();
            return bLast - aLast;
          })
          .slice(0, 5);

        return (
          <div className="p-4 bg-white border border-[#007c89]/20 rounded-lg shadow-md">
            <h4 className="font-bebas text-lg text-[#181818] mb-3">{widget.title}</h4>
            <div className="space-y-2">
              {recentClients.length === 0 ? (
                <p className="text-xs text-[#6B7280]">Aucun client récent</p>
              ) : (
                recentClients.map(client => (
                  <div key={client.id} className="text-sm text-[#181818]">
                    {client.nom}
                  </div>
                ))
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bebas text-2xl text-[#181818]">Tableau de Bord</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {widgets
          .sort((a, b) => a.position - b.position)
          .map(widget => (
            <div key={widget.id}>
              {renderWidget(widget)}
            </div>
          ))}
      </div>
    </div>
  );
};

