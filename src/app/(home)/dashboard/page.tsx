"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import Alert from '@/components/Alert';

// Define needed types
type ApiKeyMetadata = {
  id: number;
  userId: number;
  createdAt: string;
  expiresAt: string | null;
  revoked: boolean;
};

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useUserProfile(true);

  // State variables
  const [apiKeyMetadata, setApiKeyMetadata] = useState<ApiKeyMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [keyBeingCreated, setKeyBeingCreated] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{ key: string; } | null>(null);
  const [showCreateKeyForm, setShowCreateKeyForm] = useState(false);
  const [showDeleteKeyConfirm, setShowDeleteKeyConfirm] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Fetch API key metadata once authentication is confirmed
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchApiKeyMetadata();
    }

    if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, user, authLoading]);

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  // Reset copied state when new key is created or dismissed
  useEffect(() => {
    if (!newlyCreatedKey) {
      setIsCopied(false);
    }
  }, [newlyCreatedKey]);

  const fetchApiKeyMetadata = async () => {
    try {
      const response = await fetch('/api/user/api-key/metadata');
      if (response.ok) {
        const data = await response.json();
        if (data.hasKey) {
          setApiKeyMetadata(data.metadata);
        } else {
          setApiKeyMetadata(null);
        }
      } else {
        // Error fetching metadata
        setApiKeyMetadata(null);
        console.error('Error fetching API key metadata:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching API key metadata:', error);
      setErrorMessage('Failed to load your API key information. Please try again.');
    }
  };

  const createApiKey = async () => {
    setKeyBeingCreated(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/user/api-key', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setNewlyCreatedKey({ key: data.data.apiKey });
        await fetchApiKeyMetadata();
        setSuccessMessage('API key created successfully. Make sure to copy your key now - you won\'t be able to see it again!');
        setShowCreateKeyForm(false);
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create API key');
      }
    } catch (error: any) {
      console.error('Error creating API key:', error);
      setErrorMessage(error.message || 'An error occurred while creating your API key');
    } finally {
      setKeyBeingCreated(false);
    }
  };

  const deleteApiKey = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/user/api-key', {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchApiKeyMetadata();
        setSuccessMessage('API key deleted successfully');
        setShowDeleteKeyConfirm(false);
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete API key');
      }
    } catch (error: any) {
      console.error('Error deleting API key:', error);
      setErrorMessage(error.message || 'An error occurred while deleting the API key');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-300">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">API Dashboard</h1>
          <p className="mt-2 text-gray-400">
            Manage your API key for accessing the Whisp API
          </p>
        </div>
        <div>
          <Link
            href="/settings"
            className="inline-flex items-center px-4 py-2 border border-transparent text-md font-medium rounded-md text-indigo-300 bg-gray-800 hover:bg-gray-700 hover:text-white transition-colors"
          >
            Account Settings
          </Link>
        </div>
      </div>

      {/* Alert Messages */}
      {errorMessage && (
        <Alert
          type="error"
          message={errorMessage}
          onClose={() => setErrorMessage('')}
        />
      )}

      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage('')}
        />
      )}

      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold text-white mb-6">API Key Management</h2>

        {/* API Key Status */}
        {!keyBeingCreated && !newlyCreatedKey && (
          <div className="mb-8">
            {apiKeyMetadata ? (
              <div className="p-4 border border-gray-700 rounded-lg">
                {!showCreateKeyForm && !showDeleteKeyConfirm ? (
                  // Default view - show existing key info
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-white">Your API Key</h3>
                        <p className="text-gray-400 mt-1">
                          Created: <span className="text-white">{new Date(apiKeyMetadata.createdAt).toLocaleDateString()}</span>
                        </p>
                        {apiKeyMetadata.expiresAt && (
                          <p className="text-gray-400 mt-1">
                            Expires: <span className="text-white">{new Date(apiKeyMetadata.expiresAt).toLocaleDateString()}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setShowCreateKeyForm(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Replace Key
                        </button>
                        <button
                          onClick={() => setShowDeleteKeyConfirm(true)}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                          Delete Key
                        </button>
                      </div>
                    </div>
                    <Alert
                      type="warning"
                      message="For security reasons, we don't display your API key. If you need a new key, you can create a replacement, but note that your current key will be invalidated immediately."
                    />
                  </>
                ) : showCreateKeyForm ? (
                  // Replace key form
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-white">Create a New API Key</h3>
                      <button
                        onClick={() => setShowCreateKeyForm(false)}
                        className="text-gray-400 hover:text-gray-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <Alert
                      type="error"
                      message={<span><strong>Warning:</strong> Creating a new API key will immediately invalidate your current key.
                        Any applications or scripts using your current key will stop working.</span>}
                    />
                    <div className="flex gap-2 justify-end mt-4">
                      <button
                        onClick={createApiKey}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Create New Key
                      </button>
                      <button
                        onClick={() => setShowCreateKeyForm(false)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  // Delete key confirmation
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-white">Delete API Key</h3>
                      <button
                        onClick={() => setShowDeleteKeyConfirm(false)}
                        className="text-gray-400 hover:text-gray-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <Alert
                      type="error"
                      message={<span><strong>Warning:</strong> Deleting your API key will immediately revoke access.
                        Any applications or scripts using this key will stop working.</span>}
                    />
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => {
                          deleteApiKey();
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        Delete Key
                      </button>
                      <button
                        onClick={() => setShowDeleteKeyConfirm(false)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="p-4 border border-gray-700 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-4">Create an API Key</h3>
                <p className="text-gray-400 mb-4">
                  You don't have an API key yet. Create one to access the Whisp API programmatically.
                </p>
                <button
                  onClick={createApiKey}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Create API Key
                </button>
              </div>
            )}
          </div>
        )}

        {/* Key Creation Loading State */}
        {keyBeingCreated && (
          <div className="mb-8 p-4 border border-blue-700 rounded-lg">
            <div className="flex items-center justify-center gap-3 text-blue-400">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Creating your API key...</span>
            </div>
          </div>
        )}

        {/* Newly Created Key */}
        {newlyCreatedKey && (
          <div className="mb-8 p-4 bg-gray-900 border border-yellow-500 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-yellow-400">New API Key Created</h3>
              <button
                onClick={() => setNewlyCreatedKey(null)}
                className="text-gray-400 hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <Alert
              type="warning"
              message={<span>
                <strong>IMPORTANT: This is the only time you'll see this key.</strong> Copy it now and store it securely.
                For security reasons, we cannot show it to you again.
              </span>}
            />
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <div className="flex-grow p-3 bg-gray-800 text-gray-300 rounded font-mono text-sm break-all">
                {newlyCreatedKey.key}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(newlyCreatedKey.key);
                  setSuccessMessage('API key copied to clipboard');
                  setIsCopied(true);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                {isCopied ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copied!
                  </span>
                ) : (
                  'Copy to Clipboard'
                )}
              </button>
            </div>
          </div>
        )}

        {/* API Instructions */}
        <div className="mt-8 p-4 border border-gray-700 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-2">How to Use Your API Key</h3>
          <p className="text-gray-400 mb-4">
            Include your API key in the <code className="bg-gray-900 px-1 py-0.5 rounded">x-api-key</code> header of your requests to authenticate:
          </p>
          <div className="bg-gray-900 p-3 rounded-md overflow-x-auto">
            <pre className="text-gray-300 font-mono text-sm">
              {`# Submit GeoJSON data
curl -X POST "https://whisp.openforis.org/api/submit/geojson" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"features": [{"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[...]]]}]}'

# Submit WKT data
curl -X POST "https://whisp.openforis.org/api/submit/wkt" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"wkt": "POLYGON((...))"}'

# Submit Geo IDs
curl -X POST "https://whisp.openforis.org/api/submit/geo-ids" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"geoIds": ["id1", "id2", "id3"]}'`}
            </pre>
          </div>
          <p className="text-gray-400 mt-4">
            For more information, check out our{' '}
            <Link href="/documentation/api-guide" className="text-blue-400 hover:underline">
              API documentation
            </Link>
          </p>
        </div>
        {/* API Instructions */}
        <div className="mt-8 p-4 border border-gray-700 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-2">Analyze your File</h3>
          <p className="text-gray-400 mb-4">
            Submit your geojson or wkt and receive the Whisp analysis
          </p>
          {apiKeyMetadata ? (
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Submit
            </Link>
          ) : (
            <button
              onClick={async () => {
                await createApiKey();
                router.push('/');
              }}
              disabled={keyBeingCreated}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {keyBeingCreated ? 'Creating Key...' : 'Submit'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}