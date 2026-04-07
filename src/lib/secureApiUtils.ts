type TempApiKeyResponse = {
  apiKey: string;
  expiresAt?: string | null;
};

export async function fetchTempApiKey(uiClientSecret: string, source: string = 'client'): Promise<TempApiKeyResponse> {
  try {
    // Generate a timestamp-based token to help prevent replay attacks
    const timestamp = new Date().getTime();
    const csrfToken = `${source}-${timestamp}-${Math.random().toString(36).substring(2, 10)}`;
    
    const response = await fetch('/api/temp-key', {
      headers: {
        'X-Client-Secret': uiClientSecret,
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