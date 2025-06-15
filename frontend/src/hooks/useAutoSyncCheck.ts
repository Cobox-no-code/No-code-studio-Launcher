import { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { checkCloudSyncStatus } from '@/redux/slices/syncRestoreSlice';
import { fetchFirms } from '@/redux/slices/firmSlice';

export const useAutoSyncCheck = () => {
  const dispatch = useAppDispatch();
  const { phone, login } = useAppSelector(state => state.userinfo);
  const { needsRestore, isCheckingSync } = useAppSelector(state => state.syncRestore);
  const { firms } = useAppSelector(state => state.firm);
  
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [cloudFirms, setCloudFirms] = useState([]);
  
  // Simple session tracking
  const checkedInThisSession = useRef(false);
  const currentPhone = useRef(null);

  useEffect(() => {
    console.log('useAutoSyncCheck - State:', {
      phone,
      login,
      firmsLength: firms.length,
      checkedInThisSession: checkedInThisSession.current,
      currentPhone: currentPhone.current,
      isCheckingSync
    });

    // Reset check status when phone changes (new login)
    if (phone !== currentPhone.current) {
      console.log('Phone changed, resetting check status');
      checkedInThisSession.current = false;
      currentPhone.current = phone;
    }

    // Only proceed if user is logged in and has phone
    if (!phone || !login) {
      console.log('No phone or not logged in, skipping sync check');
      return;
    }

    // Skip if already checked in this session
    if (checkedInThisSession.current) {
      console.log('Already checked in this session, skipping');
      return;
    }

    // Skip if currently checking
    if (isCheckingSync) {
      console.log('Currently checking sync, skipping');
      return;
    }

    // Skip if firms already loaded (means we've initialized)
    if (firms.length > 0) {
      console.log('Firms already loaded, marking as checked');
      checkedInThisSession.current = true;
      return;
    }

    // Perform sync check
    const performSyncCheck = async () => {
      console.log('Performing sync check for phone:', phone);
      checkedInThisSession.current = true;

      // Check localStorage first
      const syncCheckKey = `syncCheck_${phone}`;
      const hasChecked = localStorage.getItem(syncCheckKey);

      if (hasChecked === 'true') {
        console.log('Already checked in localStorage, fetching firms');
        dispatch(fetchFirms());
        return;
      }

      try {
        console.log('Checking cloud sync status...');
        const result = await dispatch(checkCloudSyncStatus(phone)).unwrap();
        
        // Mark as checked regardless of result
        localStorage.setItem(syncCheckKey, 'true');
        
        console.log('Sync check result:', result);
        
        if (result.needsRestore && result.cloudFirms?.length > 0) {
          console.log('Needs restore, showing modal');
          setCloudFirms(result.cloudFirms);
          setShowRestoreModal(true);
        } else {
          console.log('No restore needed, fetching firms');
          dispatch(fetchFirms());
        }
      } catch (error) {
        console.error('Sync check failed:', error);
        localStorage.setItem(syncCheckKey, 'true');
        dispatch(fetchFirms());
      }
    };

    performSyncCheck();
  }, [phone, login, dispatch, firms.length, isCheckingSync]);

  // Clean up when user logs out
  useEffect(() => {
    if (!phone && !login) {
      console.log('User logged out, cleaning up');
      checkedInThisSession.current = false;
      currentPhone.current = null;
      setShowRestoreModal(false);
      setCloudFirms([]);
    }
  }, [phone, login]);

  const handleRestoreComplete = () => {
    console.log('Restore completed');
    setShowRestoreModal(false);
    dispatch(fetchFirms());
  };

  const handleSkipRestore = () => {
    console.log('Restore skipped');
    setShowRestoreModal(false);
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