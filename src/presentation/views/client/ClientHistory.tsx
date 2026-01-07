import React from 'react';
import { ClientSessionHistory } from '../../../../components/ClientSessionHistory';
import { UserProfile, SessionRecord } from '../../../../types';

interface ClientHistoryProps {
  profile: UserProfile;
  onSessionSelect?: (session: SessionRecord) => void;
}

export const ClientHistory: React.FC<ClientHistoryProps> = ({
  profile,
  onSessionSelect
}) => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
        <ClientSessionHistory
          profile={profile}
          onSessionSelect={onSessionSelect}
        />
      </div>
    </div>
  );
};

