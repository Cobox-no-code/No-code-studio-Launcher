// contexts/UserContext.tsx
"use client";

import { useRouter } from "next/navigation";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

// Define the shape of your user and context
interface User {
  id: string;
  email: string;
  wallet_address: string;
  coins: number;
  mobile_number: string;
  name: string;
  profilePicture: any;
  // Add any other user properties you expect from the API
}

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  token: string | null;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
  loading: boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // On initial load, check localStorage for existing session
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("auth_token");
      const storedUser = localStorage.getItem("userData");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse auth data from localStorage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    // Clear React state
    setUser(null);
    setToken(null);
    // Clear all relevant items from localStorage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("userData");
    // Clear the tokens from the secret file
    if (window.electronAPI?.updateSecret) {
      window.electronAPI.updateSecret({
        authToken: null,
        refreshToken: null,
        user: null,
      });
    }
    // Redirect to login
    router.push("/");
  };

  const value = { user, setUser, token, setToken, loading, logout };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Custom hook to easily access the context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
