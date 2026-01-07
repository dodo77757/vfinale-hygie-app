import React from 'react';
import { ClientCalendarView } from '../../../../components/ClientCalendarView';
import { UserProfile, PlannedSession } from '../../../../types';

interface ClientCalendarProps {
  profile: UserProfile;
  onStartSession?: (plannedSession: PlannedSession) => void;
  onUpdateProfile?: (updatedProfile: UserProfile) => void;
}

export const ClientCalendar: React.FC<ClientCalendarProps> = ({
  profile,
  onStartSession,
  onUpdateProfile
}) => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
        <ClientCalendarView
          profile={profile}
          onStartSession={onStartSession}
          onUpdateProfile={onUpdateProfile}
        />
      </div>
    </div>
  );
};

