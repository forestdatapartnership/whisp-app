import fs from 'fs';
import path from 'path';
import { createRequest } from 'node-mocks-http';
import { POST as geoIdsHandler } from '@/app/api/submit/geo-ids/route';
import { POST as geojsonHandler } from '@/app/api/submit/geojson/route';
import { POST as wktHandler } from '@/app/api/submit/wkt/route';
import { NextRequest, NextResponse } from 'next/server';

// Mock the validateApiKey function
jest.mock('@/lib/utils/apiKeyValidator', () => ({
  validateApiKey: jest.fn().mockResolvedValue({ 
    error: null, 
    userId: 'mock-user-id' 
  })
}));

// Mock next/server
jest.mock('next/server', () => {
  const original = jest.requireActual('next/server');
  return {
    ...original,
    NextResponse: {
      ...original.NextResponse,
      json: jest.fn((data, options) => ({
        status: options?.status || 200,
        json: async () => data,
        ...data
      })),
      next: jest.fn(() => ({
        status: 200,
        json: async () => ({ success: true })
      }))
    }
  };
});

const INPUT_FOLDER = path.join(__dirname, 'analysis-data/input');

describe('Dynamic API Analysis Tests', () => {
  // Reset mocks between each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  const inputFiles = fs.readdirSync(INPUT_FOLDER);
  inputFiles.forEach((file) => {
    test(`Processing ${file}`, async () => {
      const inputFilePath = path.join(INPUT_FOLDER, file);
      const inputData = JSON.parse(fs.readFileSync(inputFilePath, 'utf8'));
      
      // Create request with API key header
      const req = createRequest<NextRequest>({
        method: 'POST',
        body: inputData,
        headers: {
          'x-api-key': 'test-api-key',
          'Content-Type': 'application/json'
        },
        json: () => req.body,
      });
      
      // Add header getter method for API key validation
      req.headers.get = jest.fn((name) => {
        if (name === 'x-api-key') return 'test-api-key';
        return null;
      });

      let res: NextResponse;
      if (file.endsWith('.geo-ids.json')) {
        res = await geoIdsHandler(req);
      } else if (file.endsWith('.wkt.json')) {
        res = await wktHandler(req);
      } else if (file.endsWith('.geojson.json')) {
        res = await geojsonHandler(req);
      } else {
        throw new Error('Please check files.');
      }

      // Check that the response status is 200 and that there is a non-empty body
      expect(res.status).toBe(200);
      const jsonResponse = await res.json();
      expect(jsonResponse && Object.keys(jsonResponse).length).toBeGreaterThan(0);
    });
  });
});

