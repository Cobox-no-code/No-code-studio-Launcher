'use client'
import { backend_url } from '@/backend.config'
import { useAppDispatch } from '@/redux/hooks';
import { setUserInfo } from '@/redux/slices/userinfoSlice';
import axios from 'axios'
import React, { useEffect } from 'react'

export default function UserInfo() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const phone = localStorage.getItem('phone');
        if (!phone) {
          console.warn('No phone number found in localStorage');
          return;
        }
        
        // Use await with axios to properly handle the promise
        const response = await axios.get(`${backend_url}/user-info?phone=${phone}`);
        
        // Log the response data for debugging
        console.log('User info response:', response.data);
        
        // Make sure we have data before dispatching
        if (response.data) {
          dispatch(setUserInfo(response.data));
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchUserInfo();
  }, [dispatch]);

  return null;
}