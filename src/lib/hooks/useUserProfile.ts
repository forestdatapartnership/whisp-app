import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';

/**
 * Custom hook for fetching and managing user profile data
 * @param redirectToLogin If true, redirects to login page when not authenticated
 * @returns User profile state and related functions
 */
export function useUserProfile(redirectToLogin = false) {
  const { user, isAuthenticated, setUser, setIsAuthenticated } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/profile', {
        credentials: 'include' // Include cookies in the request
      });
      
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
    // Always attempt to fetch the profile on initial mount
    // Let the server API tell us if the user is authenticated or not
    if (!user || !isAuthenticated) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []); // Only run on initial mount

  return {
    user,
    isAuthenticated,
    loading,
    error,
    fetchUserProfile,
    logout
  };
}