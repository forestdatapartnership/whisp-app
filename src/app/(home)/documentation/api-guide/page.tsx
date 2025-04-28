'use client'

import React, { useState, useEffect } from 'react';
import SwaggerUI from "swagger-ui-react";
import 'swagger-ui-react/swagger-ui.css';
import './styles.css';
import { fetchTempApiKey } from '@/utils/secureApiUtils';

const DocumentationPage = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getApiKey = async () => {
      try {
        setLoading(true);
        const key = await fetchTempApiKey('documentation');
        setApiKey(key);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        console.error('Error fetching temp API key:', err);
      } finally {
        setLoading(false);
      }
    };

    getApiKey();
  }, []);

  // Request interceptor to add API key to all requests
  const requestInterceptor = (req: any) => {
    if (apiKey) {
      req.headers = req.headers || {};
      req.headers['X-API-KEY'] = apiKey;
    }
    return req;
  };

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Documentation</h1>
        
        {loading ? (
          <div className="bg-gray-800 p-4 text-white rounded-lg shadow-lg flex items-center justify-center h-24">
            <div className="spinner border-4 border-blue-500 border-t-transparent rounded-full w-8 h-8 animate-spin mr-3"></div>
            <p>Loading API documentation...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-500 p-4 text-white rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-2">Error Loading Documentation</h3>
            <p>{error}</p>
            <p className="mt-2">API authentication may not be available. Some features might be limited.</p>
          </div>
        ) : (
          <>
            <div className="bg-green-900/20 border border-green-500 p-4 mb-4 text-white rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-1">API Key Ready</h3>
              <p className="text-sm">Your temporary API key has been automatically set for all requests.</p>
              <p className="text-sm mt-1 text-gray-300">Key: {apiKey}</p>
            </div>
            <div id="swagger-container" className="bg-gray-800 p-4 text-white rounded-lg shadow-lg">
              <SwaggerUI 
                url="/swagger.json"
                docExpansion="list"
                supportedSubmitMethods={["get", "post", "put", "delete", "patch"]}
                tryItOutEnabled={true}
                displayRequestDuration={true}
                requestInterceptor={requestInterceptor}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentationPage;
