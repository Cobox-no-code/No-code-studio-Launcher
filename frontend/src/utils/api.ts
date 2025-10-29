// lib/api.ts
import { BACKEND_URL } from "@/utils/config";
import axios from "axios";

const api = axios.create({
  baseURL: BACKEND_URL,
});

// Interceptor 1: Add Auth Token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor 2: Handle Expired Tokens and Refresh
api.interceptors.response.use(
  (response) => response, // Directly return successful responses
  async (error) => {
    const originalRequest = error.config;

    // Check for 401 Unauthorized and ensure it's not a retry request
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark to prevent infinite loops

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) throw new Error("No refresh token available.");

        // Request new tokens using the refresh token
        const { data } = await axios.post(`${BACKEND_URL}/token/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = data;

        // 1. Update tokens in localStorage
        localStorage.setItem("auth_token", accessToken);
        localStorage.setItem("refresh_token", newRefreshToken);

        // 2. IMPORTANT: Persist new tokens in the secret file
        if (window.electronAPI?.updateSecret) {
          await window.electronAPI.updateSecret({
            authToken: accessToken,
            refreshToken: newRefreshToken,
          });
          console.log("Secret file updated with new tokens.");
        }

        // 3. Update the Authorization header for the original request
        originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;

        // 4. Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // If refresh fails, log the user out by clearing storage
        localStorage.clear();
        // and redirecting to the login page
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
