import fs from 'fs';
import path from 'path';
import { createRequest } from 'node-mocks-http'; 
import { compare } from 'fast-json-patch'; 

import geoIdsAnalysisHandler from '@/app/api/geo-ids/route';
import geojsonAnalysisHandler from '@/app/api/geojson/route';
import { NextRequest, NextResponse } from 'next/server';

const INPUT_FOLDER = path.join(__dirname, 'analysis-data/input');
const OUTPUT_FOLDER = path.join(__dirname, 'analysis-data/output');

describe('Dynamic API Analysis Tests', () => {
    const inputFiles = fs.readdirSync(INPUT_FOLDER);
    inputFiles.forEach((file) => {
      test(`Processing ${file}`, async () => {
        const inputFilePath = path.join(INPUT_FOLDER, file);
        const inputData = JSON.parse(fs.readFileSync(inputFilePath, 'utf8'));
        let req = createRequest<NextRequest>({
          method: 'POST',
          body: inputData,
          json: () => req.body
        });
  
        // process input file based on extension
        let res: NextResponse;
        if (file.endsWith(".geo-ids.json")){
          res = await geoIdsAnalysisHandler(req);
        }
        else if (file.endsWith(".geojson.json")) {
          res = await geojsonAnalysisHandler(req);
        }
        else { 
          return;
        }
        
        // validate response
        expect(res.status).toBe(200);
  
        const result = (await res.json()).data;
        const outputFilePath = path.join(OUTPUT_FOLDER, file);
        const expectedOutput = JSON.parse(fs.readFileSync(outputFilePath, 'utf8'));
  
        // compare types
        validateTypes(expectedOutput, result);

        // compare jsons
        const differences = compare(expectedOutput, result);
  
        // to do: implement a way to ignore some keys
        if (differences.length > 0) {
          console.error(`Differences for ${file}:`, differences);
        }
        expect(differences.length).toBe(0);
      });
    });
  });

  function validateTypes(expected: any, actual: any) {
    for (const key in expected) {
      if (typeof expected[key] !== typeof actual[key]) {
        throw new Error(`Type mismatch for key "${key}": expected ${typeof expected[key]} but got ${typeof actual[key]}`);
      }
    }
  }