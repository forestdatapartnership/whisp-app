'use client'

import React, { useState, useEffect } from 'react';
import SwaggerUI from "swagger-ui-react";
import 'swagger-ui-react/swagger-ui.css';
import './styles.css';
import { useApiKey } from '@/lib/contexts/ApiKeyContext';
import { useConfig } from '@/lib/contexts/ConfigContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { ChevronDown, ChevronRight, Code, FileText, Settings, AlertTriangle, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

const DocumentationPage = () => {
  const { apiKey, isLoading: loading, error: apiKeyError } = useApiKey();
  const [error, setError] = useState<string | null>(null);
  const [swaggerInstance, setSwaggerInstance] = useState<any>(null);
  const [isGeoJSONOpen, setIsGeoJSONOpen] = useState<boolean>(false);
  const [isWKTOpen, setIsWKTOpen] = useState<boolean>(false);
  const [isAnalysisOptionsOpen, setIsAnalysisOptionsOpen] = useState<boolean>(false);

  // Get dynamic limits from environment settings
  const { config } = useConfig();
  const maxGeometryLimit = config.geometryLimit;
  const maxGeometryLimitSync = config.geometryLimitSync;
  const maxRequestSizeMB = config.maxUploadFileSizeKb
    ? Math.round(config.maxUploadFileSizeKb / 1024 * 100) / 100
    : undefined;
  const processingTimeoutSeconds = Math.round(config.pythonTimeoutMs / 1000);
  const processingTimeoutSyncSeconds = Math.round(config.pythonTimeoutSyncMs / 1000);

  useEffect(() => {
    if (apiKeyError) {
      setError(apiKeyError);
    }
  }, [apiKeyError]);

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
            <div className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-400" />
                    Supported Request Body Structure
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    The API accepts two formats for geographic data submission, both with optional analysis configuration.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Card className="bg-blue-900/20 border-blue-500/40">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Zap className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="space-y-2">
                          <div className="font-medium text-white">Batch processing recommended</div>
                          <p className="text-sm text-gray-300">
                            The API is designed and optimized to process multiple features in a single request. Instead of sending one request per polygon, batch your geometries for better throughput, fewer rate-limit hits, and more efficient resource usage.
                          </p>
                          <p className="text-sm text-gray-400">
                            For GeoJSON, add multiple features to the <code className="bg-black/40 px-1 rounded">features</code> array. For WKT, use MULTIPOLYGON or GEOMETRYCOLLECTION(POLYGON(...), POLYGON(...)). Each feature is analyzed independently and results are returned in the same order. The geometry limit applies to the total feature count (e.g. a FeatureCollection with 5 features counts as 5; a MULTIPOLYGON with 3 polygons counts as 3).
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {/* GeoJSON Format Collapsible */}
                  <Collapsible open={isGeoJSONOpen} onOpenChange={setIsGeoJSONOpen}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between border-gray-600 hover:bg-gray-700 text-gray-300 hover:text-white"
                      >
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          <span>GeoJSON Format</span>
                          <Badge variant="outline" className="text-gray-400 border-gray-600">
                            /api/submit/geojson
                          </Badge>
                        </div>
                        {isGeoJSONOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <Card className="bg-gray-900/80 border-gray-600">
                        <CardContent className="pt-4">
                          <div className="bg-black/40 rounded p-3 overflow-x-auto">
                            <pre className="text-sm text-green-400">
{`{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature", 
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[
          [-1.612173914909363, 6.160144879904404],
          [-1.6128122806549074, 6.159344862841789],
          [-1.6128337383270266, 6.15914219166122],
          [-1.612173914909363, 6.160144879904404]
        ]]]
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[
          [-1.5, 6.2], [-1.5, 6.1], [-1.4, 6.1], [-1.5, 6.2]
        ]]]
      }
    }
  ],
  "analysisOptions": {
    "nationalCodes": ["co", "ci", "br"],
    "unitType": "ha",
    "async": true,
    "externalIdColumn": ""
  }
}`}
                            </pre>
                          </div>
                        </CardContent>
                      </Card>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* WKT Format Collapsible */}
                  <Collapsible open={isWKTOpen} onOpenChange={setIsWKTOpen}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between border-gray-600 hover:bg-gray-700 text-gray-300 hover:text-white"
                      >
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          <span>WKT Format</span>
                          <Badge variant="outline" className="text-gray-400 border-gray-600">
                            /api/submit/wkt
                          </Badge>
                        </div>
                        {isWKTOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <Card className="bg-gray-900/80 border-gray-600">
                        <CardContent className="pt-4">
                          <div className="bg-black/40 rounded p-3 overflow-x-auto">
                          <pre className="text-sm text-green-400">
{`{
  "wkt": "POLYGON((-4.286591893206829 5.545425708271704,-4.2872464587004755 5.54450734589365,-4.2883087863049205 5.54450734589365,-4.287901024194124 5.545607244851676,-4.286591893206829 5.545425708271704))",
  "analysisOptions": {
    "nationalCodes": ["co", "ci", "br"],
    "unitType": "ha", 
    "async": true,
    "externalIdColumn": ""
  }
}`}
                            </pre>
                          </div>
                          <div className="mt-3 p-2 bg-gray-800/50 rounded text-xs text-gray-400">
                            <strong>Multiple features:</strong> MULTIPOLYGON(((ring1)),((ring2))) or GEOMETRYCOLLECTION(POLYGON((ring1)), POLYGON((ring2))). POLYGON is one polygon only.
                          </div>
                        </CardContent>
                      </Card>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Analysis Options Collapsible */}
                  <Collapsible open={isAnalysisOptionsOpen} onOpenChange={setIsAnalysisOptionsOpen}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between border-gray-600 hover:bg-gray-700 text-gray-300 hover:text-white"
                      >
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          <span>Analysis Options Reference</span>
                        </div>
                        {isAnalysisOptionsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <Card className="bg-gray-900/80 border-gray-600">
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="bg-gray-800">
                              <CardContent className="p-3">
                                <CardTitle className="text-white text-sm mb-1">nationalCodes</CardTitle>
                                <CardDescription className="text-gray-400 mb-2">
                                  Array of additional country codes: "co" (Colombia), "ci" (Côte d'Ivoire), "br" (Brazil)
                                </CardDescription>
                                <Badge variant="secondary" className="text-xs">["co", "ci", "br"]</Badge>
                              </CardContent>
                            </Card>
                            <Card className="bg-gray-800">
                              <CardContent className="p-3">
                                <CardTitle className="text-white text-sm mb-1">unitType</CardTitle>
                                <CardDescription className="text-gray-400 mb-2">
                                  Output units: "ha" (hectares) or "percent"
                                </CardDescription>
                                <Badge variant="secondary" className="text-xs">"ha"</Badge>
                              </CardContent>
                            </Card>
                            <Card className="bg-gray-800">
                              <CardContent className="p-3">
                                <CardTitle className="text-white text-sm mb-1">async</CardTitle>
                                <CardDescription className="text-gray-400 mb-2">
                                  Processing mode: true for background, false for immediate
                                </CardDescription>
                                <Badge variant="secondary" className="text-xs">true</Badge>
                              </CardContent>
                            </Card>
                            <Card className="bg-gray-800">
                              <CardContent className="p-3">
                                <CardTitle className="text-white text-sm mb-1">externalIdColumn</CardTitle>
                                <CardDescription className="text-gray-400 mb-2">
                                  Optional column name for external identifiers
                                </CardDescription>
                                <Badge variant="secondary" className="text-xs">""</Badge>
                              </CardContent>
                            </Card>
                          </div>
                        </CardContent>
                      </Card>
                    </CollapsibleContent>
                  </Collapsible>

                  <Separator className="my-6" />

                  {/* Requirements */}
                  <Card className="bg-gray-800 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-gray-400" />
                        Requirements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-gray-300">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <strong>Coordinates:</strong> Must be in WGS84 (EPSG:4326) coordinate system
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <strong>Geometry Types:</strong> Polygon, MultiPolygon, GeometryCollection
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <strong>GeoJSON Format:</strong> Valid FeatureCollection with Feature array
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <strong>WKT Format:</strong> Valid Well-Known Text geometry string
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <strong>CRS Validation:</strong> No projected coordinate systems (values in meters)
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <strong>Geometry Limit Async (async=true):</strong> Maximum {maxGeometryLimit} geometries per request
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <strong>Geometry Limit Sync (async=false):</strong> Maximum {maxGeometryLimitSync} geometries per request
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <strong>Processing Timeout Async (async=true):</strong> Maximum {processingTimeoutSeconds} seconds per analysis
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <strong>Processing Timeout Sync (async=false):</strong> Maximum {processingTimeoutSyncSeconds} seconds per analysis
                        </li>
                        {maxRequestSizeMB && (
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <strong>Request Size Limit:</strong> Maximum {maxRequestSizeMB} MB per request
                          </li>
                        )}
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <strong>Rate Limit:</strong> Per API key, configurable (default: 30 requests per 60 seconds)
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <strong>Max Concurrent Analyses:</strong> Per API key, configurable (default: 2 running jobs)
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    📤 Response Formats
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    API responses vary based on synchronous or asynchronous processing mode.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Card className="bg-gray-900 border-gray-600">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-medium text-white">Sync (async=false)</span>
                      </div>
                      <code className="text-sm bg-black/40 px-3 py-2 rounded block text-green-400">
                        {`{"code": "analysis_completed", "message": "Analysis completed successfully", "data": [...]}`}
                      </code>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-900 border-gray-600">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-white">Async (async=true)</span>
                      </div>
                      <code className="text-sm bg-black/40 px-3 py-2 rounded block text-blue-400">
                        {`{"code": "analysis_processing", "message": "Analysis in progress...", "data": {"token": "...", "statusUrl": "..."}}`}
                      </code>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    🔍 Status Endpoint
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Use the status endpoint to check async analysis progress.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Card className="bg-gray-900">
                    <CardContent className="p-3">
                      <div className="font-medium text-gray-200 mb-1">Endpoint</div>
                      <code className="text-sm bg-black/40 px-2 py-1 rounded text-yellow-400">GET /api/status/{`{token}`}</code>
                    </CardContent>
                  </Card>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <Card className="bg-gray-900 border-gray-600">
                      <CardContent className="p-2">
                        <div className="font-medium text-white mb-1">Processing</div>
                        <code className="bg-black/40 px-2 py-1 rounded text-yellow-400">{`{"code": "analysis_processing", "message": "..."}`}</code>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-900 border-gray-600">
                      <CardContent className="p-2">
                        <div className="font-medium text-white mb-1">Completed</div>
                        <code className="bg-black/40 px-2 py-1 rounded text-green-400">{`{"code": "analysis_completed", "message": "...", "data": [...]}`}</code>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-900 border-gray-600">
                      <CardContent className="p-2">
                        <div className="font-medium text-white mb-1">Failed</div>
                        <code className="bg-black/40 px-2 py-1 rounded text-red-400">{`{"code": "analysis_error", "message": "..."}`}</code>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    ⚠️ Response Format & Codes
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    All API responses follow the same format with standardized codes. See the <strong>SystemCodes</strong> schema in Swagger for complete documentation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Card className="bg-gray-900">
                    <CardContent className="pt-4">
                      <div className="font-medium text-gray-200 mb-2">Standard Response Format</div>
                      <code className="text-sm bg-black/40 px-3 py-2 rounded block text-cyan-400">
                        {`{"code": "...", "message": "...", "data": "..."}`}
                      </code>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-gray-900 border-gray-600">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white text-base flex items-center gap-2">
                          🔐 Auth & System Codes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        <div className="flex justify-between items-center gap-2">
                          <Badge variant="outline" className="text-gray-300 border-gray-500 text-xs">auth_missing_api_key</Badge>
                          <span className="text-gray-400 text-sm">No API key (401)</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <Badge variant="outline" className="text-gray-300 border-gray-500 text-xs">auth_invalid_api_key</Badge>
                          <span className="text-gray-400 text-sm">Invalid key (401)</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <Badge variant="outline" className="text-gray-300 border-gray-500 text-xs">auth_rate_limit_exceeded</Badge>
                          <span className="text-gray-400 text-sm">Rate limit (429)</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <Badge variant="outline" className="text-gray-300 border-gray-500 text-xs">system_missing_request_body</Badge>
                          <span className="text-gray-400 text-sm">No body (400)</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <Badge variant="outline" className="text-gray-300 border-gray-500 text-xs">system_internal_server_error</Badge>
                          <span className="text-gray-400 text-sm">Server error (500)</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-900 border-gray-600">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white text-base flex items-center gap-2">
                          🔄 Analysis Codes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        <div className="flex justify-between items-center gap-2">
                          <Badge variant="outline" className="text-gray-300 border-gray-500 text-xs">analysis_processing</Badge>
                          <span className="text-gray-400 text-sm">Running (200)</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <Badge variant="outline" className="text-gray-300 border-gray-500 text-xs">analysis_completed</Badge>
                          <span className="text-gray-400 text-sm">Success (200)</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <Badge variant="outline" className="text-gray-300 border-gray-500 text-xs">analysis_error</Badge>
                          <span className="text-gray-400 text-sm">Failed (500)</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <Badge variant="outline" className="text-gray-300 border-gray-500 text-xs">analysis_timeout</Badge>
                          <span className="text-gray-400 text-sm">Timed out (408)</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <Badge variant="outline" className="text-gray-300 border-gray-500 text-xs">analysis_job_not_found</Badge>
                          <span className="text-gray-400 text-sm">Job not found (404)</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <Badge variant="outline" className="text-gray-300 border-gray-500 text-xs">analysis_too_many_concurrent</Badge>
                          <span className="text-gray-400 text-sm">Too many jobs (429)</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-900 border-gray-600 md:col-span-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white text-base flex items-center gap-2">
                          ❌ Validation Codes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        <div className="flex justify-between items-center gap-2">
                          <Badge variant="outline" className="text-gray-300 border-gray-500 text-xs">validation_invalid_geojson</Badge>
                          <span className="text-gray-400 text-sm">Bad GeoJSON (400)</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <Badge variant="outline" className="text-gray-300 border-gray-500 text-xs">validation_invalid_wkt</Badge>
                          <span className="text-gray-400 text-sm">Bad WKT (400)</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <Badge variant="outline" className="text-gray-300 border-gray-500 text-xs">validation_too_many_geometries</Badge>
                          <span className="text-gray-400 text-sm">Limit exceeded (400)</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <Badge variant="outline" className="text-gray-300 border-gray-500 text-xs">validation_invalid_coordinates</Badge>
                          <span className="text-gray-400 text-sm">Invalid coords (400)</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <Badge variant="outline" className="text-gray-300 border-gray-500 text-xs">validation_invalid_crs</Badge>
                          <span className="text-gray-400 text-sm">Invalid CRS (400)</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <Badge variant="outline" className="text-gray-300 border-gray-500 text-xs">validation_coordinates_in_meters</Badge>
                          <span className="text-gray-400 text-sm">Coords in meters (400)</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <Badge variant="outline" className="text-gray-300 border-gray-500 text-xs">validation_request_body_too_large</Badge>
                          <span className="text-gray-400 text-sm">Body too large (413)</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <Badge variant="outline" className="text-gray-300 border-gray-500 text-xs">validation_missing_required_fields</Badge>
                          <span className="text-gray-400 text-sm">Missing fields (400)</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <Badge variant="outline" className="text-gray-300 border-gray-500 text-xs">validation_invalid_external_id_column</Badge>
                          <span className="text-gray-400 text-sm">Bad external ID (400)</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

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
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentationPage;
