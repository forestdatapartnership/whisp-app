/**
 * Utilities for secure API key management
 */

import { getUIClientSecret } from './utils/configUtils';

// Client secret for UI-only endpoints - should match server value
const UI_CLIENT_SECRET = getUIClientSecret();

/**
 * Fetches a temporary API key from the server with appropriate security headers
 * @param source - Identifier for the source of the request (for logging)
 * @returns The API key or throws an error
 */
type TempApiKeyResponse = {
  apiKey: string;
  expiresAt?: string | null;
};

export async function fetchTempApiKey(source: string = 'client'): Promise<TempApiKeyResponse> {
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
      return {
        apiKey: data.apiKey,
        expiresAt: data.expiresAt ?? null,
      };
    }
    return { apiKey: '' };
  } catch (err) {
    console.error('Error fetching temp API key:', err);
    return { apiKey: '' };
  }
}

/**
 * Fetches the authenticated user's API key
 * @returns The user's API key or throws an error
 */
type ApiKeyWithMeta = {
  apiKey: string;
  createdAt: string | null;
  expiresAt: string | null;
};

export async function fetchUserApiKey(): Promise<ApiKeyWithMeta> {
  try {
    const response = await fetch('/api/user/api-key', {
      method: 'GET',
      credentials: 'include', // Include cookies for authentication
      cache: 'no-store' // Ensure the browser doesn't cache this request
    });
    
    if (!response.ok) {
      return { apiKey: '', createdAt: null, expiresAt: null };
    }
    
    const data = await response.json();
    
    if (data.data.apiKey) {
      return {
        apiKey: data.data.apiKey,
        createdAt: data.data.createdAt ?? null,
        expiresAt: data.data.expiresAt ?? null,
      };
    }
    return { apiKey: '', createdAt: null, expiresAt: null };
  } catch (err) {
    console.error('Error fetching user API key:', err);
    return { apiKey: '', createdAt: null, expiresAt: null };
  }
}

/**
 * Creates headers for API requests including the API key if available
 */
export function createApiHeaders(apiKey?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Whisp-Agent': 'ui'
  };
  
  if (apiKey) {
    headers['X-API-KEY'] = apiKey;
  }
  
  return headers;
}

export async function fetchApiKey(): Promise<string | null> {
  const statusRes = await fetch('/api/auth/status', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store'
  });
  const statusData = await statusRes.json();
  const isAuthenticated = statusRes.ok && statusData?.code === 'auth_status_authenticated';
  if (isAuthenticated) {
    const userKey = await fetchUserApiKey();
    if (userKey.apiKey) {
      return userKey.apiKey;
    }
  }

  const tempKey = await fetchTempApiKey().catch(() => ({ apiKey: '' }));
  return tempKey.apiKey || null;
}