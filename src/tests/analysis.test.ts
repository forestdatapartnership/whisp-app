import fs from 'fs';
import path from 'path';
import { createRequest } from 'node-mocks-http'; 
import { compare } from 'fast-json-patch'; 

import { POST as geoIdsAnalysisHandler } from '@/app/api/geo-ids/route';
import { POST as geojsonAnalysisHandler } from '@/app/api/geojson/route';
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

  function validateTypes(expected: any, actual: any) : void {
    // validate array members
    if (Array.isArray(expected) && Array.isArray(actual)) {
      if (expected.length !== actual.length) {
        throw new Error(
          `Array length mismatch: expected ${expected.length} but got ${actual.length}`
        );
      }
      for (let i = 0; i < expected.length; i++) {
        validateTypes(expected[i], actual[i]);
      }
    } 
    // validate nested objects
    else if (typeof expected === 'object' && expected !== null &&
             typeof actual === 'object' && actual !== null) {
      const expectedKeys = Object.keys(expected);
      const actualKeys = Object.keys(actual);
  
      if (expectedKeys.length !== actualKeys.length) {
        throw new Error(
          `Object key length mismatch: expected ${expectedKeys.length} keys but got ${actualKeys.length} keys`
        );
      }
  
      for (const key of expectedKeys) {
        if (!(key in actual)) {
          throw new Error(`Key "${key}" is missing in actual object`);
        }
        validateTypes(expected[key], actual[key]);
      }
    }
    // validate primitive types 
    else if (typeof expected !== typeof actual) {
      throw new Error(
        `Type mismatch: expected ${typeof expected} but got ${typeof actual}`
      );
    }
  }
