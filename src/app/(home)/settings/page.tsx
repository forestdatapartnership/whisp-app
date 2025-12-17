"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Link from 'next/link';

function SettingsContent() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, refreshUser, logout } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    organization: '',
    email: ''
  });
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletionInProgress, setDeletionInProgress] = useState(false);

  // Populate form data when user profile is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        lastName: user.last_name || '',
        organization: user.organization || '',
        email: user.email || ''
      });
      setLoading(false);
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission to update profile
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setUpdating(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          lastName: formData.lastName,
          organization: formData.organization || null
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(data.message || 'Profile updated successfully');
        await refreshUser();
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setErrorMessage(error.message || 'An error occurred while updating your profile');
    } finally {
      setUpdating(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setErrorMessage('Password is required to delete your account');
      return;
    }

    setErrorMessage('');
    setDeletionInProgress(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: deletePassword
        }),
      });

      if (response.ok) {
        await logout();
        router.push('/');
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete account');
      }
    } catch (error: any) {
      console.error('Error deleting account:', error);
      setErrorMessage(error.message || 'An error occurred while deleting your account');
      setDeletionInProgress(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-300">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Account Settings</h1>
          <p className="mt-2 text-gray-400">
            Manage your profile information and account settings
          </p>
        </div>
        <div>
          <Link 
            href="/dashboard" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-300 bg-gray-800 hover:bg-gray-700 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
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

      {/* Profile Form */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold text-white mb-6">Profile Information</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* First Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                First Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
              />
            </div>

            {/* Last Name Field */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
              />
            </div>

            {/* Email Field (Read Only) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                disabled
                className="mt-1 block w-full rounded-md border-gray-600 bg-gray-800 text-gray-400 shadow-sm sm:text-sm py-2 px-3 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-400">Email address cannot be changed</p>
            </div>

            {/* Organization Field */}
            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-300 mb-1">
                Organization (Optional)
              </label>
              <input
                id="organization"
                name="organization"
                type="text"
                value={formData.organization}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updating}
              className={`px-4 py-2 ${
                updating ? 'bg-indigo-800' : 'bg-indigo-600 hover:bg-indigo-700'
              } text-white rounded-md transition-colors flex items-center`}
            >
              {updating && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {updating ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Account Management */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-white mb-6">Account Management</h2>
        
        <div className="border-t border-gray-700 pt-4">
          <h3 className="text-lg font-medium text-red-400 mb-4">Danger Zone</h3>
          <div className="p-4 border border-red-800 rounded-lg bg-red-900/20">
            <h4 className="text-md font-medium text-white mb-2">Delete Account</h4>
            <p className="text-gray-400 text-sm mb-4">
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-red-400">Confirm Account Deletion</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                className="text-gray-400 hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 mb-4 text-red-200 text-sm">
              <p className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>
                  <strong>Warning:</strong> This action cannot be undone. All your data, including API keys and analysis results, will be permanently deleted.
                </span>
              </p>
            </div>
            
            <p className="mb-4 text-gray-300">
              Please enter your password to confirm:
            </p>
            
            <div className="mb-4">
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                required
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                disabled={deletionInProgress}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className={`px-4 py-2 ${
                  deletionInProgress ? 'bg-red-800' : 'bg-red-600 hover:bg-red-700'
                } text-white rounded-md transition-colors flex items-center`}
                disabled={deletionInProgress || !deletePassword}
              >
                {deletionInProgress && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {deletionInProgress ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}