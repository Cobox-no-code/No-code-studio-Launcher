// 3. Update your login component/hook to check for cloud sync
// hooks/useAutoSyncCheck.ts
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { checkCloudSyncStatus } from '@/redux/slices/syncRestoreSlice';
import { fetchFirms } from '@/redux/slices/firmSlice';

export const useAutoSyncCheck = () => {
  const dispatch = useAppDispatch();
  const { phone } = useAppSelector(state => state.userinfo);
  const { needsRestore, isCheckingSync } = useAppSelector(state => state.syncRestore);
  const { firms } = useAppSelector(state => state.firm);
  
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [cloudFirms, setCloudFirms] = useState([]);

  useEffect(() => {
    const checkSyncStatus = async () => {
      if (phone && firms.length === 0) {
        try {
          const result = await dispatch(checkCloudSyncStatus(phone)).unwrap();
          if (result.needsRestore) {
            setCloudFirms(result.cloudFirms);
            setShowRestoreModal(true);
          } else {
            // Proceed with normal firm fetching
            dispatch(fetchFirms());
          }
        } catch (error) {
          console.error('Failed to check sync status:', error);
          // Fallback to normal firm fetching
          dispatch(fetchFirms());
        }
      }
    };

    checkSyncStatus();
  }, [phone, dispatch, firms.length]);

  const handleRestoreComplete = () => {
    setShowRestoreModal(false);
    // Refresh firms after restoration
    dispatch(fetchFirms());
  };

  const handleSkipRestore = () => {
    setShowRestoreModal(false);
    // Proceed with normal firm fetching
    dispatch(fetchFirms());
  };

  return {
    showRestoreModal,
    setShowRestoreModal,
    cloudFirms,
    needsRestore,
    isCheckingSync,
    handleRestoreComplete,
    handleSkipRestore
  };
};


/*
In your CompanySelector component, add this useEffect to handle newly restored firms:


*/

// 8. Usage in your main app
// In your main App component or layout:

/*
import AppInitializer from '@/components/AppInitializer';

function App() {
  return (
    <Provider store={store}>
      <AppInitializer>
        {// Your existing app content}
      </AppInitializer>
    </Provider>
  );
}
*/