"use client";
import { backend_url } from "@/backend.config";
import { API_BASE_URL } from "@/redux/api/api.config";
import { useAppDispatch } from "@/redux/hooks";
import { setUserInfo, updateIsExpired } from "@/redux/slices/userinfoSlice";
import axios from "axios";
import React, { useEffect, useState } from "react";

export default function UserInfo() {
  const dispatch = useAppDispatch();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check if subscription is expired
  const checkSubscriptionExpiration = (userData) => {
    if (!userData?.subscription?.end_date) return true;

    const now = new Date();
    const endDate = new Date(userData.subscription.end_date);
    return endDate <= now;
  };

  // Cache user data for offline mode
  const cacheUserData = (userData) => {
    if (!userData) return;

    try {
      localStorage.setItem("cachedUserInfo", JSON.stringify(userData));

      // Separately cache subscription for easier access
      if (userData.subscription) {
        localStorage.setItem(
          "cachedSubscription",
          JSON.stringify(userData.subscription)
        );
      }
    } catch (error) {
      console.error("Error caching user data:", error);
    }
  };

  // Load cached user data
  const loadCachedUserData = () => {
    try {
      const cachedData = localStorage.getItem("cachedUserInfo");
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (error) {
      console.error("Error loading cached user data:", error);
    }
    return null;
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // Check if we're offline
        if (isOffline) {
          const firmId = localStorage.getItem("firmId");
          const firm = await axios.get(`${API_BASE_URL}/firms/${firmId}`);
          // If offline, try to load from cache
          const cachedData = loadCachedUserData();
          if (cachedData) {
            // Check subscription expiration for cached data
            const isExpired = checkSubscriptionExpiration(cachedData);
            dispatch(
              setUserInfo({
                ...cachedData,
                isExpired,
                sync_enabled: firm.data.sync_enabled,
              })
            );
            console.log("Using cached user info (offline)");
            return;
          }
          console.warn("No cached user data available while offline");
          return;
        }

        // If online, proceed with API call
        const phone = localStorage.getItem("phone");
        const machine_id = localStorage.getItem("machine_id");
        console.log(machine_id);
        if (!phone) {
          console.warn("No phone number found in localStorage");
          return;
        }

        // Use await with axios to properly handle the promise
        const response = await axios.get(
          `${backend_url}/user-info?phone=${phone}&machine_id=${machine_id}`
        );

        // Log the response data for debugging
        console.log("User info response:", response.data);

        // Make sure we have data before dispatching
        if (response.data) {
          // Check if subscription is expired
          const isExpired = checkSubscriptionExpiration(response.data);

          // Dispatch user info with expiration flag
          dispatch(
            setUserInfo({
              ...response.data,
              isExpired,
              login: response.data.force_logout,
            })
          );

          // Cache the data for offline use
          cacheUserData(response.data);
        }
      } catch (error) {
        console.error("Error fetching user info:", error);

        // If error occurs, try to use cached data
        const cachedData = loadCachedUserData();
        if (cachedData) {
          const isExpired = checkSubscriptionExpiration(cachedData);
          dispatch(
            setUserInfo({
              ...cachedData,
              isExpired,
            })
          );
          console.log("Using cached user info (after API error)");
        }
      }
    };

    fetchUserInfo();
  }, [dispatch, isOffline]);

  // Refetch on reconnection
  useEffect(() => {
    if (!isOffline) {
      console.log("Device back online, refreshing user info");
      const fetchUserInfo = async () => {
        try {
          const phone = localStorage.getItem("phone");
          const firmId = localStorage.getItem("firmId");
          const machine_id = localStorage.getItem("machine_id");
          if (!phone) return;

          const response = await axios.get(
            `${backend_url}/user-info?phone=${phone}&machine_id=${machine_id}`
          );
          const firm = await axios.get(`${API_BASE_URL}/firms/${firmId}`);
          if (response.data || firm.data) {
            const isExpired = checkSubscriptionExpiration(response.data);
            dispatch(
              setUserInfo({
                ...response.data,
                isExpired,
                sync_enabled: firm.data.sync_enabled,
              })
            );
            cacheUserData(response.data);
          }
        } catch (error) {
          console.error(
            "Error refreshing user info after reconnection:",
            error
          );
        }
      };

      fetchUserInfo();
    }
  }, [isOffline, dispatch]);

  return null;
}
