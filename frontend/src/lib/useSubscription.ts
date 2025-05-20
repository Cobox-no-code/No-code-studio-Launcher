// useSubscription.js
import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import subscriptionService from './subscription';
import { updateSubscriptionStatus } from '@/redux/slices/userinfoSlice';

/**
 * Custom hook for managing subscription-related functionality
 * @param {Function} fetchSubscriptionFromAPI - Optional function to fetch subscription from API
 * @returns {Object} Subscription-related data and utility functions
 */
export const useSubscription = (fetchSubscriptionFromAPI = null) => {
  const dispatch = useAppDispatch();
  const userInfo = useAppSelector((state) => state.userinfo);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isLoading, setIsLoading] = useState(false);
  
  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Initialize subscription when component mounts
  useEffect(() => {
    // Skip if we already have subscription data
    if (userInfo?.subscription) return;
    
    const initialize = async () => {
      // If no API function is provided, just use cached data
      if (!fetchSubscriptionFromAPI) {
        const cachedSubscription = subscriptionService.loadCachedSubscription();
        if (cachedSubscription) {
          subscriptionService.checkSubscriptionStatus(cachedSubscription, dispatch);
        }
        return;
      }
      
      setIsLoading(true);
      try {
        await subscriptionService.initializeSubscription(dispatch, fetchSubscriptionFromAPI);
      } catch (error) {
        console.error('Error initializing subscription:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
  }, [dispatch, fetchSubscriptionFromAPI, userInfo?.subscription]);
  
  // Update subscription status check when coming back online
  useEffect(() => {
    // Only run when transitioning from offline to online
    if (isOffline === false && fetchSubscriptionFromAPI) {
      const updateSubscription = async () => {
        setIsLoading(true);
        try {
          const subscription = await fetchSubscriptionFromAPI();
          if (subscription) {
            subscriptionService.checkSubscriptionStatus(subscription, dispatch);
            subscriptionService.cacheSubscription(subscription);
          }
        } catch (error) {
          console.error('Error updating subscription after reconnect:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      updateSubscription();
    }
  }, [isOffline, dispatch, fetchSubscriptionFromAPI]);
  
  // Get time remaining calculation
  const timeRemaining = userInfo?.subscription
    ? subscriptionService.getTimeRemaining(userInfo.subscription)
    : null;
  
  // Cache subscription when it changes
  useEffect(() => {
    if (userInfo?.subscription) {
      subscriptionService.cacheSubscription(userInfo.subscription);
    }
  }, [userInfo?.subscription]);
  
  return {
    subscription: userInfo?.subscription,
    isExpired: userInfo?.isExpired || false,
    timeRemaining,
    isOffline,
    isLoading,
    
    // Utility method to manually check expiration
    checkExpirationStatus: () => {
      if (!userInfo?.subscription) return true;
      return subscriptionService.checkSubscriptionStatus(userInfo.subscription, dispatch);
    },
    
    // Utility method to manually refresh from API
    refreshSubscription: async () => {
      if (!fetchSubscriptionFromAPI) return null;
      
      setIsLoading(true);
      try {
        const subscription = await fetchSubscriptionFromAPI();
        if (subscription) {
          const isExpired = subscriptionService.checkSubscriptionStatus(subscription, dispatch);
          subscriptionService.cacheSubscription(subscription);
          return { subscription, isExpired };
        }
      } catch (error) {
        console.error('Error refreshing subscription:', error);
      } finally {
        setIsLoading(false);
      }
      return null;
    }
  };
};

export default useSubscription;