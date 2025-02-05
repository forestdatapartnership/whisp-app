import fs from 'fs';
import path from 'path';
import { createRequest } from 'node-mocks-http';
import { POST as geoIdsHandler } from '@/app/api/geo-ids/route';
import { POST as geojsonHandler } from '@/app/api/geojson/route';
import { POST as wktHandler } from '@/app/api/wkt/route';
import { NextRequest, NextResponse } from 'next/server';

const INPUT_FOLDER = path.join(__dirname, 'analysis-data/input');

describe('Dynamic API Analysis Tests', () => {
  const inputFiles = fs.readdirSync(INPUT_FOLDER);
  inputFiles.forEach((file) => {
    test(`Processing ${file}`, async () => {
      const inputFilePath = path.join(INPUT_FOLDER, file);
      const inputData = JSON.parse(fs.readFileSync(inputFilePath, 'utf8'));
      const req = createRequest<NextRequest>({
        method: 'POST',
        body: inputData,
        json: () => req.body,
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

