import React, { useMemo } from 'react';
import { UserProfile } from '../types';

interface CoachAlertsPanelProps {
  clients: UserProfile[];
  onClientClick?: (client: UserProfile) => void;
}

interface Alert {
  type: 'pain' | 'sleep' | 'inactive' | 'injury';
  severity: 'high' | 'medium' | 'low';
  client: UserProfile;
  message: string;
  date?: string;
}

export const CoachAlertsPanel: React.FC<CoachAlertsPanelProps> = ({
  clients,
  onClientClick
}) => {
  const alerts = useMemo(() => {
    const alertList: Alert[] = [];

    clients.forEach(client => {
      // Alerte douleur récente
      if (client.lastPainReport && client.lastPainReport.intensity >= 5) {
        const daysSince = client.lastPainReport.date
          ? Math.floor((Date.now() - new Date(client.lastPainReport.date).getTime()) / (1000 * 60 * 60 * 24))
          : Infinity;
        
        if (daysSince <= 7) {
          alertList.push({
            type: 'pain',
            severity: client.lastPainReport.intensity >= 7 ? 'high' : client.lastPainReport.intensity >= 5 ? 'medium' : 'low',
            client,
            message: `Douleur ${client.lastPainReport.location} (${client.lastPainReport.intensity}/10)`,
            date: client.lastPainReport.date
          });
        }
      }

      // Alerte sommeil insuffisant
      if (client.sleepQuality === 'Mauvaise') {
        alertList.push({
          type: 'sleep',
          severity: 'high',
          client,
          message: 'Sommeil insuffisant - Risque de récupération altérée'
        });
      }

      // Alerte inactivité
      const hasRecentSession = client.sessionRecords && client.sessionRecords.length > 0;
      const lastSessionDate = hasRecentSession 
        ? new Date(client.sessionRecords[client.sessionRecords.length - 1].date)
        : null;
      const daysSinceLastSession = lastSessionDate 
        ? Math.floor((Date.now() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24))
        : Infinity;

      if (daysSinceLastSession > 30 && (client.activeProgram || hasRecentSession)) {
        alertList.push({
          type: 'inactive',
          severity: daysSinceLastSession > 60 ? 'high' : daysSinceLastSession > 45 ? 'medium' : 'low',
          client,
          message: `Pas de session depuis ${daysSinceLastSession} jours`
        });
      }

      // Alerte blessures actives
      if (client.blessures_actives && client.blessures_actives.length > 0) {
        alertList.push({
          type: 'injury',
          severity: 'medium',
          client,
          message: `Blessures actives: ${client.blessures_actives.join(', ')}`
        });
      }
    });

    // Trier par sévérité (high > medium > low) puis par date
    alertList.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      
      if (a.date && b.date) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return 0;
    });

    return alertList;
  }, [clients]);

  if (alerts.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#BAE6FD] to-white border-2 border-[#7DD3FC] shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">✅</span>
          <p className="text-xs font-bebas text-[#1F2937] uppercase tracking-wider font-semibold">Alertes</p>
        </div>
        <p className="text-xs text-[#6B7280] font-medium">Aucune alerte</p>
      </div>
    );
  }

  const getAlertColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return 'bg-gradient-to-r from-[#FEE2E2] to-[#FECACA] border-2 border-[#EF4444] text-[#DC2626]';
      case 'medium':
        return 'bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] border-2 border-[#F59E0B] text-[#D97706]';
      case 'low':
        return 'bg-gradient-to-r from-[#FED7AA] to-[#FCD34D] border-2 border-[#F97316] text-[#EA580C]';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'pain':
        return '🔴';
      case 'sleep':
        return '😴';
      case 'inactive':
        return '⏸️';
      case 'injury':
        return '⚠️';
      default:
        return '⚠️';
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-white to-[#F0F9FF] border-2 border-[#BAE6FD] shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <p className="text-xs font-bebas text-[#1F2937] uppercase tracking-wider font-semibold">Alertes</p>
        </div>
        <span className="text-xs font-bold text-white bg-gradient-to-r from-[#38BDF8] to-[#7DD3FC] px-3 py-1 rounded-full shadow-sm">{alerts.length}</span>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
        {alerts.map((alert, idx) => (
          <div
            key={`${alert.client.id}-${alert.type}-${idx}`}
            onClick={() => onClientClick && onClientClick(alert.client)}
            className={`p-3 rounded-xl border cursor-pointer hover:shadow-md transition-all duration-200 ${getAlertColor(alert.severity)}`}
          >
            <div className="flex items-start gap-2">
              <span className="text-base">{getAlertIcon(alert.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bebas text-sm text-[#1F2937] truncate font-semibold">{alert.client.nom}</p>
                  {alert.date && (
                    <span className="text-[10px] font-medium text-[#6B7280]">
                      {new Date(alert.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium leading-tight text-[#4B5563]">{alert.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

