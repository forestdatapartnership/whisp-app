'use client'

import React, { useState, useEffect } from 'react';
import SwaggerUI from "swagger-ui-react";
import 'swagger-ui-react/swagger-ui.css';
import './styles.css';
import { fetchTempApiKey } from '@/lib/secureApiUtils';

const DocumentationPage = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [swaggerInstance, setSwaggerInstance] = useState<any>(null);

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
                        <div className="mb-6 bg-slate-800/40 border border-slate-600 p-4 text-white rounded-lg">
              <h3 className="text-lg font-semibold mb-2">📋 Request Body Parameters</h3>
              <p className="mb-3">The API accepts JSON request bodies with the following structure:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-700/50 p-3 rounded">
                  <h4 className="font-semibold text-slate-200 mb-2">🔧 analysisOptions (optional)</h4>
                  <ul className="space-y-1 text-slate-300">
                    <li><strong>nationalCodes:</strong> ["co", "ci", "br"] - Additional countries data</li>
                    <li><strong>unitType:</strong> "ha" | "percent" - Output units</li>
                    <li><strong>async:</strong> true | false - Processing mode</li>
                    <li><strong>externalIdColumn:</strong> string - Optional ID column</li>
                  </ul>
                </div>
                
                <div className="bg-teal-800/40 p-3 rounded">
                  <h4 className="font-semibold text-teal-200 mb-2">🗺️ Geographic Data</h4>
                  <ul className="space-y-1 text-teal-100">
                    <li><strong>GeoJSON:</strong> FeatureCollection with Polygon features</li>
                    <li><strong>WKT:</strong> Well-Known Text polygon string</li>
                    <li><strong>Coordinates:</strong> Must be in WGS84 (EPSG:4326)</li>
                    <li><strong>Geometry:</strong> Only Polygon type supported</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-4 bg-gray-700/40 p-3 rounded">
                <h4 className="font-semibold text-gray-200 mb-2">📤 Submit Endpoints Response Formats (ApiResponse Structure)</h4>
                <div className="space-y-2 text-gray-300 text-sm">
                  <div>
                    <strong>Sync (async=false):</strong><br />
                    <code className="text-xs">{`{"code": "analysis_completed", "message": "Analysis completed successfully", "data": [...]}`}</code>
                  </div>
                  <div>
                    <strong>Async (async=true):</strong><br />
                    <code className="text-xs">{`{"code": "analysis_processing", "message": "Analysis in progress...", "data": {"token": "...", "statusUrl": "..."}}`}</code>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 bg-blue-800/30 p-3 rounded">
                <h4 className="font-semibold text-blue-200 mb-2">🔍 Status Endpoint</h4>
                <p className="text-blue-100 text-sm mb-2">Use the status endpoint to check async analysis progress:</p>
                <div className="space-y-1 text-blue-100 text-xs">
                  <div><strong>Endpoint:</strong> <code>GET /api/status/{`{token}`}</code></div>
                  <div><strong>Processing:</strong> <code>{`{"code": "analysis_processing", "message": "...", "data": {"token": "...", "statusUrl": "..."}}`}</code></div>
                  <div><strong>Completed:</strong> <code>{`{"code": "analysis_completed", "message": "...", "data": [...]}`}</code></div>
                  <div><strong>Failed:</strong> <code>{`{"code": "analysis_error", "message": "...", "data": null}`}</code></div>
                </div>
              </div>
              
              <div className="mt-4 bg-amber-800/25 p-3 rounded">
                <h4 className="font-semibold text-amber-200 mb-2">⚠️ Common Response Codes</h4>
                <p className="text-amber-100 text-sm mb-3">All API responses follow the same format with standardized codes. See the <strong>SystemCodes</strong> schema in Swagger for complete documentation:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-amber-800/40 p-2 rounded">
                    <h5 className="font-semibold text-amber-200 mb-1">🔄 Analysis Codes</h5>
                    <ul className="space-y-1 text-amber-100">
                      <li><code>analysis_processing</code> - Running</li>
                      <li><code>analysis_completed</code> - Success</li>
                      <li><code>analysis_error</code> - Failed</li>
                      <li><code>analysis_timeout</code> - Timed out</li>
                      <li><code>analysis_job_not_found</code> - Invalid token</li>
                    </ul>
                  </div>
                  
                  <div className="bg-amber-800/40 p-2 rounded">
                    <h5 className="font-semibold text-amber-200 mb-1">❌ Validation Codes</h5>
                    <ul className="space-y-1 text-amber-100">
                      <li><code>validation_invalid_geojson</code> - Bad GeoJSON</li>
                      <li><code>validation_invalid_wkt</code> - Bad WKT</li>
                      <li><code>validation_invalid_coordinates</code> - Bad coords</li>
                      <li><code>validation_too_many_geometries</code> - Limit exceeded</li>
                      <li><code>auth_invalid_api_key</code> - Auth error</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-3 text-xs text-amber-100">
                  <strong>Response Format:</strong> <code className="bg-amber-800/60 px-1 rounded">{`{"code": "...", "message": "...", "data": "..."}`}</code>
                </div>
              </div>
            </div>

            <div id="swagger-container" className="bg-gray-800 p-4 text-white rounded-lg shadow-lg">
              <SwaggerUI 
                url="/swagger.json"
                docExpansion="list"
                defaultModelsExpandDepth={2}
                defaultModelExpandDepth={2}
                showExtensions={true}
                showCommonExtensions={true}
                supportedSubmitMethods={["get", "post", "put", "delete", "patch"]}
                tryItOutEnabled={true}
                displayRequestDuration={true}
                requestInterceptor={requestInterceptor}
                persistAuthorization={true}
                displayOperationId={false}
                filter={true}
                onComplete={ui => {
                  // Store the Swagger UI instance
                  setSwaggerInstance(ui);
                  
                  // This ensures the API key is available when Swagger UI is fully loaded
                  if (apiKey) {
                    // Set default API key in Swagger UI's auth
                    ui.preauthorizeApiKey("ApiKeyAuth", apiKey);
                  }
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentationPage;
