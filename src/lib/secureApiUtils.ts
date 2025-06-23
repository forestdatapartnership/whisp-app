/**
 * Utilities for secure API key management
 */

// Client secret for UI-only endpoints - should match server value
const UI_CLIENT_SECRET = process.env.NEXT_PUBLIC_UI_CLIENT_SECRET || 'whisp-ui-client-access';

/**
 * Fetches a temporary API key from the server with appropriate security headers
 * @param source - Identifier for the source of the request (for logging)
 * @returns The API key or throws an error
 */
export async function fetchTempApiKey(source: string = 'client'): Promise<string> {
  try {
    // Generate a timestamp-based token to help prevent replay attacks
    const timestamp = new Date().getTime();
    const csrfToken = `${source}-${timestamp}-${Math.random().toString(36).substring(2, 10)}`;
    
    const response = await fetch('/api/temp-key', {
      headers: {
        'X-Client-Secret': UI_CLIENT_SECRET,
        'X-CSRF-Token': csrfToken
      },
      // Cache: 'no-store' ensures the browser doesn't cache this request
      cache: 'no-store'
    });
    
    const data = await response.json();
    
    if (data.success && data.apiKey) {
      return data.apiKey;
    } else {
      throw new Error(data.error || 'Failed to retrieve API key');
    }
  } catch (err) {
    console.error('Error fetching temp API key:', err);
    throw err;
  }
}

/**
 * Fetches the authenticated user's API key
 * @returns The user's API key or throws an error
 */
export async function fetchUserApiKey(): Promise<string> {
  try {
    const response = await fetch('/api/user/api-key', {
      method: 'GET',
      credentials: 'include', // Include cookies for authentication
      cache: 'no-store' // Ensure the browser doesn't cache this request
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to retrieve user API key');
    }
    
    const data = await response.json();
    
    if (data.apiKey) {
      return data.apiKey;
    } else {
      throw new Error('No API key found for user');
    }
  } catch (err) {
    console.error('Error fetching user API key:', err);
    throw err;
  }
}

/**
 * Creates headers for API requests including the API key if available
 */
export function createApiHeaders(apiKey?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (apiKey) {
    headers['X-API-KEY'] = apiKey;
  }
  
  return headers;
}