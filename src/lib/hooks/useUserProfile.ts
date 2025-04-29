import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { hasCookie } from '@/lib/utils';

/**
 * Custom hook for fetching and managing user profile data
 * @param redirectToLogin If true, redirects to login page when not authenticated
 * @returns User profile state and related functions
 */
export function useUserProfile(redirectToLogin = false) {
  const { user, isAuthenticated, setUser, setIsAuthenticated } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedCookie, setCheckedCookie] = useState(false);
  const router = useRouter();

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/profile');
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
        return true;
      } else {
        if (response.status === 401) {
          if (redirectToLogin) {
            router.push('/login');
          }
          setIsAuthenticated(false);
        }
        setError('Failed to fetch user profile');
        return false;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('An error occurred while fetching user profile');
      return false;
    } finally {
      setLoading(false);
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
      
      if (redirectToLogin) {
        router.push('/login');
      }
      return true;
    } catch (error) {
      console.error('Error logging out:', error);
      setError('An error occurred while logging out');
      return false;
    }
  };

  useEffect(() => {
    // First check if we have an auth cookie (token or refreshToken), if not, don't bother making an API call
    const hasAuthCookie = hasCookie('token') || hasCookie('refreshToken');
    setCheckedCookie(true);
    
    // Only fetch the profile if:
    // 1. We have a cookie that might indicate authentication
    // 2. We don't already have a user and aren't already authenticated
    if (hasAuthCookie && !user && !isAuthenticated) {
      fetchUserProfile();
    } else {
      // If no auth cookie, set loading to false immediately
      if (!hasAuthCookie) {
        setIsAuthenticated(false);
      }
      setLoading(false);
    }
  }, [user, isAuthenticated, checkedCookie]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    fetchUserProfile,
    logout
  };
}