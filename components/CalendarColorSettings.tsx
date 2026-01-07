import React, { useState, useEffect } from 'react';
import { UserProfile, ClientGroup, CalendarColorScheme } from '../types';

interface CalendarColorSettingsProps {
  clients: UserProfile[];
  groups?: ClientGroup[];
  onColorSchemeChange: (scheme: CalendarColorScheme) => void;
  onClose?: () => void;
}

const STORAGE_KEY = 'hygie_calendar_color_scheme';
const DEFAULT_COLORS = [
  '#007c89', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

export const CalendarColorSettings: React.FC<CalendarColorSettingsProps> = ({
  clients,
  groups = [],
  onColorSchemeChange,
  onClose
}) => {
  const [colorScheme, setColorScheme] = useState<CalendarColorScheme>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : { clientColors: {}, groupColors: {}, defaultColor: '#007c89' };
    } catch {
      return { clientColors: {}, groupColors: {}, defaultColor: '#007c89' };
    }
  });

  useEffect(() => {
    onColorSchemeChange(colorScheme);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colorScheme));
  }, [colorScheme, onColorSchemeChange]);

  const setClientColor = (clientId: string, color: string) => {
    setColorScheme({
      ...colorScheme,
      clientColors: {
        ...colorScheme.clientColors,
        [clientId]: color
      }
    });
  };

  const setGroupColor = (groupId: string, color: string) => {
    setColorScheme({
      ...colorScheme,
      groupColors: {
        ...colorScheme.groupColors,
        [groupId]: color
      }
    });
  };

  const getClientColor = (clientId: string): string => {
    // Vérifier d'abord la couleur du client
    if (colorScheme.clientColors?.[clientId]) {
      return colorScheme.clientColors[clientId];
    }

    // Vérifier la couleur du groupe
    const clientGroup = groups.find(g => g.clientIds.includes(clientId));
    if (clientGroup && colorScheme.groupColors?.[clientGroup.id]) {
      return colorScheme.groupColors[clientGroup.id];
    }

    // Couleur par défaut
    return colorScheme.defaultColor || '#007c89';
  };

  const removeClientColor = (clientId: string) => {
    const newClientColors = { ...colorScheme.clientColors };
    delete newClientColors[clientId];
    setColorScheme({
      ...colorScheme,
      clientColors: newClientColors
    });
  };

  const removeGroupColor = (groupId: string) => {
    const newGroupColors = { ...colorScheme.groupColors };
    delete newGroupColors[groupId];
    setColorScheme({
      ...colorScheme,
      groupColors: newGroupColors
    });
  };

  return (
    <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bebas text-xl text-[#181818]">Personnalisation des Couleurs</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#181818] text-xl"
          >
            ✕
          </button>
        )}
      </div>

      {/* Couleur par défaut */}
      <div>
        <label className="block text-sm font-semibold text-[#181818] mb-2">
          Couleur par défaut
        </label>
        <div className="flex gap-2">
          {DEFAULT_COLORS.map(color => (
            <button
              key={color}
              onClick={() => setColorScheme({ ...colorScheme, defaultColor: color })}
              className={`w-10 h-10 rounded-md border-2 transition-all ${
                colorScheme.defaultColor === color
                  ? 'border-[#181818] scale-110'
                  : 'border-[#007c89]/30 hover:border-[#007c89]'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
          <input
            type="color"
            value={colorScheme.defaultColor || '#007c89'}
            onChange={(e) => setColorScheme({ ...colorScheme, defaultColor: e.target.value })}
            className="w-10 h-10 rounded-md border-2 border-[#007c89]/30 cursor-pointer"
          />
        </div>
      </div>

      {/* Couleurs par client */}
      <div>
        <label className="block text-sm font-semibold text-[#181818] mb-3">
          Couleurs par Client
        </label>
        <div className="max-h-64 overflow-y-auto border border-[#007c89]/30 rounded-md p-3 custom-scrollbar space-y-2">
          {clients.map(client => {
            const currentColor = getClientColor(client.id);
            return (
              <div key={client.id} className="flex items-center justify-between p-2 hover:bg-[#f3efe5] rounded">
                <span className="text-sm text-[#181818] font-semibold">{client.nom}</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border border-[#007c89]/30"
                    style={{ backgroundColor: currentColor }}
                  />
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => setClientColor(client.id, e.target.value)}
                    className="w-8 h-8 rounded border-2 border-[#007c89]/30 cursor-pointer"
                  />
                  {colorScheme.clientColors?.[client.id] && (
                    <button
                      onClick={() => removeClientColor(client.id)}
                      className="text-[#EF4444] hover:text-[#DC2626] text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Couleurs par groupe */}
      {groups.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-[#181818] mb-3">
            Couleurs par Groupe
          </label>
          <div className="space-y-2">
            {groups.map(group => {
              const currentColor = colorScheme.groupColors?.[group.id] || group.color || colorScheme.defaultColor || '#007c89';
              return (
                <div key={group.id} className="flex items-center justify-between p-2 hover:bg-[#f3efe5] rounded">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: group.color || currentColor }}
                    />
                    <span className="text-sm text-[#181818] font-semibold">{group.name}</span>
                    <span className="text-xs text-[#6B7280]">
                      ({group.clientIds.length} client{group.clientIds.length > 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentColor}
                      onChange={(e) => setGroupColor(group.id, e.target.value)}
                      className="w-8 h-8 rounded border-2 border-[#007c89]/30 cursor-pointer"
                    />
                    {colorScheme.groupColors?.[group.id] && (
                      <button
                        onClick={() => removeGroupColor(group.id)}
                        className="text-[#EF4444] hover:text-[#DC2626] text-sm"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-[#007c89]/20">
        <button
          onClick={() => {
            const reset: CalendarColorScheme = { clientColors: {}, groupColors: {}, defaultColor: '#007c89' };
            setColorScheme(reset);
          }}
          className="px-4 py-2 bg-white text-[#181818] border border-[#007c89]/30 rounded-md text-sm font-semibold hover:bg-[#f3efe5] transition-all"
        >
          Réinitialiser
        </button>
      </div>
    </div>
  );
};

