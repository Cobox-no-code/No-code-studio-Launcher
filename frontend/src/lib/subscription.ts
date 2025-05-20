// subscriptionService.js
import { updateSubscriptionStatus } from '@/redux/slices/userinfoSlice';

/**
 * Service for managing subscription-related functionality
 */
const subscriptionService = {
  /**
   * Check if the subscription is expired and update Redux store
   * @param {Object} subscription - The subscription object
   * @param {Function} dispatch - Redux dispatch function
   */
  checkSubscriptionStatus: (subscription, dispatch) => {
    if (!subscription) return;
    
    const now = new Date();
    const endDate = new Date(subscription.end_date);
    const isExpired = endDate <= now;
    
    dispatch(updateSubscriptionStatus({
      subscription,
      isExpired
    }));
    
    return isExpired;
  },
  
  /**
   * Load cached subscription from localStorage
   * @returns {Object|null} The cached subscription or null
   */
  loadCachedSubscription: () => {
    try {
      const cachedData = localStorage.getItem('cachedSubscription');
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (error) {
      console.error('Error loading cached subscription:', error);
    }
    return null;
  },
  
  /**
   * Cache the subscription data to localStorage
   * @param {Object} subscription - The subscription object to cache
   */
  cacheSubscription: (subscription) => {
    if (!subscription) return;
    
    try {
      localStorage.setItem('cachedSubscription', JSON.stringify(subscription));
    } catch (error) {
      console.error('Error caching subscription:', error);
    }
  },
  
  /**
   * Get the time remaining until subscription expires
   * @param {Object} subscription - The subscription object
   * @returns {Object|null} Object containing days, hours, minutes remaining or null
   */
  getTimeRemaining: (subscription) => {
    if (!subscription?.end_date) return null;
    
    const now = new Date();
    const endDate = new Date(subscription.end_date);
    
    if (endDate <= now) {
      return { days: 0, hours: 0, minutes: 0 };
    }
    
    const diffInMs = endDate.getTime() - now.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffInMinutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      days: diffInDays,
      hours: diffInHours,
      minutes: diffInMinutes
    };
  },
  
  /**
   * Initialize subscription status from cache or API
   * @param {Function} dispatch - Redux dispatch function
   * @param {Function} fetchSubscriptionFromAPI - Function to fetch subscription from API
   */
  initializeSubscription: async (dispatch, fetchSubscriptionFromAPI) => {
    // Try to load from cache first
    const cachedSubscription = subscriptionService.loadCachedSubscription();
    let subscription = cachedSubscription;
    let isFromCache = true;
    
    // If online, try to fetch from API
    if (navigator.onLine) {
      try {
        const apiSubscription = await fetchSubscriptionFromAPI();
        if (apiSubscription) {
          subscription = apiSubscription;
          isFromCache = false;
          // Update cache with fresh data
          subscriptionService.cacheSubscription(apiSubscription);
        }
      } catch (error) {
        console.error('Error fetching subscription from API:', error);
      }
    }
    
    // If we have a subscription (from API or cache), check if it's expired
    if (subscription) {
      const isExpired = subscriptionService.checkSubscriptionStatus(subscription, dispatch);
      return { subscription, isExpired, isFromCache };
    }
    
    return null;
  }
};

export default subscriptionService;