"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Define needed types
type ApiKeyDetails = {
  id: string;
  name: string;
  createdAt: string;
  lastUsed?: string;
};

type UserProfile = {
  id: string;
  name: string;
  lastName: string;
  email: string;
  organization?: string;
};

export default function Dashboard() {
  const router = useRouter();
  
  // State variables
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [apiKeyInfo, setApiKeyInfo] = useState<{ hasKey: boolean; keyDetails: ApiKeyDetails | null }>({ hasKey: false, keyDetails: null });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    organization: '',
    email: '',
  });
  const [newKeyName, setNewKeyName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [keyBeingCreated, setKeyBeingCreated] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{ key: string; name: string } | null>(null);
  const [showCreateKeyForm, setShowCreateKeyForm] = useState(false);
  const [showReplaceKeyConfirm, setShowReplaceKeyConfirm] = useState(false);
  const [showDeleteKeyConfirm, setShowDeleteKeyConfirm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status and fetch user profile
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user/profile');
        
        if (response.ok) {
          const userData = await response.json();
          setUserProfile(userData);
          setFormData({
            name: userData.name || '',
            lastName: userData.lastName || '',
            organization: userData.organization || '',
            email: userData.email || '',
          });
          setIsAuthenticated(true);
          fetchApiKeyInfo();
        } else {
          // Not authenticated, redirect to login
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchApiKeyInfo = async () => {
    try {
      const response = await fetch('/api/user/api-keys');
      if (response.ok) {
        const data = await response.json();
        setApiKeyInfo(data);
      } else {
        throw new Error('Failed to fetch API key information');
      }
    } catch (error) {
      console.error('Error fetching API key information:', error);
      setErrorMessage('Failed to load your API key information. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setSuccessMessage('Profile updated successfully');
        setUserProfile({
          ...userProfile!,
          ...formData
        });
        setEditMode(false);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setErrorMessage(error.message || 'An error occurred while updating your profile');
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      setErrorMessage('Please enter a name for your API key');
      return;
    }
    
    setKeyBeingCreated(true);
    setErrorMessage('');
    
    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setNewlyCreatedKey({ key: data.key, name: data.name });
        await fetchApiKeyInfo();
        setNewKeyName('');
        setSuccessMessage('API key created successfully. Make sure to copy your key now - you won\'t be able to see it again!');
        setShowCreateKeyForm(false);
        setShowReplaceKeyConfirm(false);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create API key');
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
      const response = await fetch('/api/user/api-keys', {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchApiKeyInfo();
        setSuccessMessage('API key deleted successfully');
        setShowDeleteKeyConfirm(false);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete API key');
      }
    } catch (error: any) {
      console.error('Error deleting API key:', error);
      setErrorMessage(error.message || 'An error occurred while deleting the API key');
    }
  };

  const initiateAccountDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!deletePassword) {
      setErrorMessage('Please enter your password to confirm account deletion');
      return;
    }
    
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: deletePassword }),
      });
      
      if (response.ok) {
        // Redirect to home page after account deletion
        router.push('/');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete account');
      }
    } catch (error: any) {
      console.error('Error deleting account:', error);
      setErrorMessage(error.message || 'An error occurred while attempting to delete your account');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/auth/logout', {
        method: 'POST',
      });
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-300">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">User Dashboard</h1>
          <p className="mt-2 text-gray-400">
            Manage your account, API keys, and preferences
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Log Out
        </button>
      </div>

      {/* Alert Messages */}
      {errorMessage && (
        <div className="mb-6 p-3 bg-[#2B2538] border border-red-500 rounded-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-red-500">{errorMessage}</span>
          <button 
            onClick={() => setErrorMessage('')} 
            className="ml-auto text-gray-400 hover:text-gray-200"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-3 bg-[#121E24] border border-green-500 rounded-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-green-500">{successMessage}</span>
          <button 
            onClick={() => setSuccessMessage('')} 
            className="ml-auto text-gray-400 hover:text-gray-200"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-700 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('api-keys')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'api-keys'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
            }`}
          >
            API Key
          </button>
          <button
            onClick={() => setActiveTab('delete-account')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'delete-account'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-gray-400 hover:text-red-300 hover:border-red-700'
            }`}
          >
            Delete Account
          </button>
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white">Your Profile</h2>
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditMode(false);
                  setFormData({
                    name: userProfile?.name || '',
                    lastName: userProfile?.lastName || '',
                    organization: userProfile?.organization || '',
                    email: userProfile?.email || '',
                  });
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          {!editMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-400 text-sm">First Name</p>
                <p className="text-white text-lg">{userProfile?.name}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Last Name</p>
                <p className="text-white text-lg">{userProfile?.lastName}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Email</p>
                <p className="text-white text-lg">{userProfile?.email}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Organization</p>
                <p className="text-white text-lg">{userProfile?.organization || 'Not specified'}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="name" className="block text-sm text-gray-400 mb-2">
                    First Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm text-gray-400 mb-2">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm text-gray-400 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                    readOnly
                  />
                  <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label htmlFor="organization" className="block text-sm text-gray-400 mb-2">
                    Organization
                  </label>
                  <input
                    id="organization"
                    name="organization"
                    type="text"
                    value={formData.organization}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'api-keys' && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">API Key</h2>
          
          {/* API Key Status */}
          {!keyBeingCreated && !newlyCreatedKey && (
            <div className="mb-8">
              {apiKeyInfo.hasKey ? (
                <div className="p-4 border border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-white">Your API Key</h3>
                      <p className="text-gray-400 mt-1">
                        Key Name: <span className="text-white">{apiKeyInfo.keyDetails?.name}</span>
                      </p>
                      <p className="text-gray-400 mt-1">
                        Created: <span className="text-white">{new Date(apiKeyInfo.keyDetails?.createdAt || '').toLocaleDateString()}</span>
                      </p>
                      {apiKeyInfo.keyDetails?.lastUsed && (
                        <p className="text-gray-400 mt-1">
                          Last Used: <span className="text-white">{new Date(apiKeyInfo.keyDetails.lastUsed).toLocaleDateString()}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setShowReplaceKeyConfirm(true)}
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
                  <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-3 text-yellow-200 text-sm">
                    <p className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>
                        For security reasons, we don't display your full API key. If you need a new key, you 
                        can create a replacement, but note that your current key will be invalidated immediately.
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 border border-gray-700 rounded-lg">
                  <h3 className="text-lg font-medium text-white mb-4">Create an API Key</h3>
                  <p className="text-gray-400 mb-4">
                    You don't have an API key yet. Create one to access the Whisp API programmatically.
                  </p>
                  <button
                    onClick={() => setShowCreateKeyForm(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Create API Key
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Create Key Form */}
          {showCreateKeyForm && !keyBeingCreated && !newlyCreatedKey && (
            <div className="mb-8 p-4 border border-gray-700 rounded-lg">
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
              
              <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-3 mb-4 text-yellow-200 text-sm">
                <p className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>
                    <strong>Important:</strong> Your API key will only be shown once after creation. 
                    Make sure to copy it and store it in a secure location. You will not be able to 
                    view it again after navigating away from this page.
                  </span>
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Key name (e.g., Development, Production)"
                  className="flex-grow px-4 py-2 bg-gray-700 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  onClick={createApiKey}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Create API Key
                </button>
              </div>
            </div>
          )}

          {/* Replace Key Confirmation */}
          {showReplaceKeyConfirm && !keyBeingCreated && !newlyCreatedKey && (
            <div className="mb-8 p-4 border border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Replace API Key</h3>
                <button
                  onClick={() => setShowReplaceKeyConfirm(false)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 mb-4 text-red-200 text-sm">
                <p className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>
                    <strong>Warning:</strong> Creating a new API key will immediately invalidate your current key.
                    Any applications or scripts using your current key will stop working.
                  </span>
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Key name (e.g., Development, Production)"
                  className="flex-grow px-4 py-2 bg-gray-700 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      createApiKey();
                      setShowReplaceKeyConfirm(false);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Replace Key
                  </button>
                  <button
                    onClick={() => setShowReplaceKeyConfirm(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Key Confirmation */}
          {showDeleteKeyConfirm && (
            <div className="mb-8 p-4 border border-gray-700 rounded-lg">
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
              
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 mb-4 text-red-200 text-sm">
                <p className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>
                    <strong>Warning:</strong> Deleting your API key will immediately revoke access.
                    Any applications or scripts using this key will stop working.
                  </span>
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
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
              <div className="bg-red-900/30 border border-red-500 rounded-lg p-3 mb-4 text-red-200 text-sm">
                <p className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>
                    <strong>IMPORTANT: This is the only time you'll see this key.</strong> Copy it now and store it securely. 
                    For security reasons, we cannot show it to you again.
                  </span>
                </p>
              </div>
              <div className="mb-2">
                <p className="text-gray-400 mb-1">Name: <span className="text-white">{newlyCreatedKey.name}</span></p>
                <p className="text-gray-400 mb-1">Created: <span className="text-white">{new Date().toLocaleDateString()}</span></p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <div className="flex-grow p-3 bg-gray-800 text-gray-300 rounded font-mono text-sm break-all">
                  {newlyCreatedKey.key}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newlyCreatedKey.key);
                    setSuccessMessage('API key copied to clipboard');
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  Copy to Clipboard
                </button>
              </div>
            </div>
          )}

          {/* API Instructions */}
          <div className="mt-8 p-4 border border-gray-700 rounded-lg">
            <h3 className="text-lg font-medium text-white mb-2">How to Use Your API Key</h3>
            <p className="text-gray-400 mb-4">
              Include your API key in the header of your requests to authenticate:
            </p>
            <div className="bg-gray-900 p-3 rounded-md overflow-x-auto">
              <pre className="text-gray-300 font-mono text-sm">
                {`curl -X POST "https://api.whisp.app/v1/your-endpoint" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"key": "value"}'`}
              </pre>
            </div>
            <p className="text-gray-400 mt-4">
              For more information, check out our{' '}
              <Link href="/documentation/api-guide" className="text-blue-400 hover:underline">
                API documentation
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Delete Account Tab */}
      {activeTab === 'delete-account' && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Delete Account</h2>
          
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-5 mb-8">
            <h3 className="text-lg font-medium text-red-400 mb-2">Warning: This action cannot be undone</h3>
            <p className="text-gray-300 mb-4">
              Deleting your account will permanently remove all your data, including:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1">
              <li>Your profile information</li>
              <li>All API keys</li>
              <li>Analysis results and history</li>
              <li>Saved maps and datasets</li>
            </ul>
            <p className="text-gray-300">
              Once deleted, your data cannot be recovered. Please make sure to export any important data before proceeding.
            </p>
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              I understand, delete my account
            </button>
          ) : (
            <div className="border border-gray-700 rounded-lg p-5">
              <h3 className="text-lg font-medium text-white mb-4">
                Confirm Account Deletion
              </h3>
              <form onSubmit={initiateAccountDeletion}>
                <div className="mb-4">
                  <label htmlFor="delete-password" className="block text-sm text-gray-400 mb-2">
                    Enter your password to confirm
                  </label>
                  <input
                    id="delete-password"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Delete My Account Permanently
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword('');
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}