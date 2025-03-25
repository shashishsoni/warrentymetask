import { useState, useEffect, useCallback, useRef } from 'react';
import axios, { AxiosError } from 'axios';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  isLoading: boolean;
  handleGoogleSuccess: (code: string) => Promise<boolean>;
  setAuthToken: (token: string) => void;
  logout: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasVerifiedToken = useRef(false);
  const isFetchingUser = useRef(false);

  const verifyToken = useCallback(async (storedToken: string) => {
    if (isFetchingUser.current) return;
    
    try {
      isFetchingUser.current = true;
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` }
      });
      setUser(response.data);
      setToken(storedToken);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      isFetchingUser.current = false;
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    if (!hasVerifiedToken.current) {
      hasVerifiedToken.current = true;
      verifyToken(storedToken);
    }
  }, [verifyToken]);

  const handleGoogleSuccess = async (code: string) => {
    try {
      console.log("Exchanging code for token:", code.substring(0, 10) + "...");
      localStorage.setItem('google_auth_code', code);
      const response = await axios.post(`${API_URL}/api/auth/google/callback`, { code });
      console.log("Auth response:", response.data);
      
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
        setUser(response.data.user);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Google login failed details:', 
        axiosError.response?.data || (error as Error).message);
      return false;
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    hasVerifiedToken.current = false;
  }, []);

  const setAuthToken = useCallback((newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setIsAuthenticated(true);
    
    if (isFetchingUser.current) return;
    
    isFetchingUser.current = true;
    axios.get(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${newToken}` }
    })
    .then(response => {
      setUser(response.data);
    })
    .catch(error => {
      console.error('Failed to fetch user data:', error);
    })
    .finally(() => {
      isFetchingUser.current = false;
    });
  }, []);

  return {
    user,
    isAuthenticated,
    token,
    isLoading,
    handleGoogleSuccess,
    setAuthToken,
    logout
  };
}; 