"use client";
import React from 'react';
import { useAppSelector } from '@/redux/hooks';
import { useAutoSyncCheck } from '@/hooks/useAutoSyncCheck';
import RestoreDataModal from '@/components/_modal/RestoreDataModal';
import LoadingScreen from '@/components/LoadingScreen';

interface AppInitializerProps {
  children: React.ReactNode;
}

const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const { phone, login } = useAppSelector(state => state.userinfo);
  const {
    showRestoreModal,
    cloudFirms,
    isCheckingSync,
    handleRestoreComplete,
    handleSkipRestore
  } = useAutoSyncCheck();

  // Show loading screen while checking sync for authenticated users
  if (phone && login && isCheckingSync) {
    return (
      <LoadingScreen 
        title="Checking Your Account"
        subtitle="Looking for your synchronized data..."
      />
    );
  }

  return (
    <>
      {children}
      
      {/* Restore Data Modal */}
      <RestoreDataModal
        open={showRestoreModal}
        onClose={handleSkipRestore}
        cloudFirms={cloudFirms}
        onRestoreComplete={handleRestoreComplete}
      />
    </>
  );
};

export default AppInitializer;