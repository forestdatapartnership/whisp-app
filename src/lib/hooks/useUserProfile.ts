import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';

/**
 * Custom hook for fetching and managing user profile data
 * @param redirectToLogin If true, redirects to login page when not authenticated
 * @returns User profile state and related functions
 */
export function useUserProfile(redirectToLogin = false) {
  const { user, isAuthenticated, setUser, setIsAuthenticated } = useStore();
  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Use a ref to track if a fetch is in progress to prevent duplicate requests
  const fetchInProgress = useRef(false);

  const fetchUserProfile = async () => {
    // If a fetch is already in progress, don't start another one
    if (fetchInProgress.current) {
      return false;
    }
    
    setLoading(true);
    setError(null);
    fetchInProgress.current = true;

    try {
      const statusRes = await fetch('/api/auth/status', { credentials: 'include' });
      if (statusRes.ok) {
        const status = await statusRes.json();
        if (!status.authenticated) {
          setIsAuthenticated(false);
          setUser(null);
          return false;
        }
      }

      const response = await fetch('/api/user/profile', {
        credentials: 'include' // Include cookies in the request
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(!!data.user);
        setUser(data.user ?? null);
        return !!data.user;
      } else {
        if (response.status === 401) {
          if (redirectToLogin) {
            router.push('/login');
          }
          setIsAuthenticated(false);
          setUser(null);
        }
        setError('Failed to fetch user profile');
        return false;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('An error occurred while fetching user profile');
      setIsAuthenticated(false);
      setUser(null);
      return false;
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  };

  const logout = async () => {
    try {
      // Call the logout API endpoint to clear HTTP-only cookies
      const response = await fetch('/api/auth/logout', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      // Update the store state
      setUser(null);
      setIsAuthenticated(false);
      
      // Always redirect to homepage on logout
      window.location.href = '/';
      return true;
    } catch (error) {
      console.error('Error logging out:', error);
      setError('An error occurred while logging out');
      return false;
    }
  };

  useEffect(() => {
    // Only fetch profile if we don't have a user or authentication state
    if (!user || !isAuthenticated) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]); // Include dependencies

  return {
    user,
    isAuthenticated,
    loading,
    error,
    fetchUserProfile,
    logout
  };
}