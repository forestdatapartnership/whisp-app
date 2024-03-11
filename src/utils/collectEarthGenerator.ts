import { promises as fsPromises } from 'fs';
import * as fs from 'fs';
import path from 'path';
import { zip } from 'zip-a-folder';
import csvParser from 'csv-parser';
import { stringify } from 'csv-stringify';


async function savePropDefinitions(uuid: string): Promise<void> {
  const sourcePath = path.join(process.cwd(), 'public', 'collect-earth', 'project_definition.properties');
  try {
    const propString = await fsPromises.readFile(sourcePath, 'utf8');

    const newPropString = propString.replace('survey_name=whisp', `survey_name=${uuid}`)
    const destPath = path.join(process.cwd(), 'temp', uuid, 'project_definition.properties');
    await fsPromises.writeFile(destPath, newPropString);
    console.log('File saved successfully.');
  } catch (error) {
    console.error('Error reading or saving the file:', error);
    throw error;
  }
}

const savePlacemarkXml = async (uuid: string): Promise<void> => {
  const sourcePath = path.join(process.cwd(), 'public', 'collect-earth', 'placemark.idm.xml');
  try {
    const xmlString = await fsPromises.readFile(sourcePath, 'utf8');
    const updatedXmlString = xmlString.replace('http://www.openforis.org/idm/whisp', `http://www.openforis.org/idm/${uuid}`);
    const savePath = path.join(process.cwd(), 'temp', uuid, 'updatedProject.xml');
    await fsPromises.writeFile(savePath, updatedXmlString);
  } catch (error) {
    console.error('Error reading or saving the XML file:', error);
    throw error;
  }
}

const modifyCsv = async (uuid: string): Promise<void> => {
  const savePath = path.join(process.cwd(), 'temp', uuid, 'plotsTest.csv');
  const sourceCsvPath = path.join(process.cwd(), 'temp', `${uuid}-result.csv`);


  readCsv(sourceCsvPath).then((data) => {
    const modifiedData = data.map((row) => ({
      ...row,
      id: row.geoid, // Rename geoid to id
      YCoordinate: 0, // Add YCoordinate column with value 0
      XCoordinate: 0, // Add XCoordinate column with value 0
    }));

    // Remove the original geoid column
    modifiedData.forEach(row => {
      delete row.geoid;
    });

    // Write the modified data to a new CSV file
    writeCsv(modifiedData, savePath)
      .then(() => console.log('CSV file with modified columns has been written successfully.'))
      .catch((error) => console.error('Error writing CSV file:', error));
  }).catch((error) => console.error('Error reading CSV file:', error));
}

async function copyDirectoryContents(srcDir: string, destDir: string): Promise<void> {
  try {
    await fsPromises.mkdir(destDir, { recursive: true });

    // Read the source directory contents
    const entries = await fsPromises.readdir(srcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);

      if (entry.isDirectory()) {
        await copyDirectoryContents(srcPath, destPath);
      } else if (entry.isFile()) {
        await fsPromises.copyFile(srcPath, destPath);
      }
    }
  } catch (error) {
    console.error('Error copying directory contents:', error);
    throw error;
  }
}

const generateCepFile = async (uuid: string) => {
  const sourceDir = path.join(process.cwd(), 'temp', uuid);
  const zipPath = path.join(process.cwd(), 'temp', `${uuid}.cep`);
  try {
    await zip(sourceDir, zipPath);
    console.log('Project zipped successfully.');
  } catch (error) {
    console.error('Error zipping the project directory:', error);
    throw error;
  }
};

export const createCollectEarthProject = async (uuid: string): Promise<void> => {
  try {
    const srcDir = path.join(process.cwd(), 'public', 'collect-earth');
    const destDir = path.join(process.cwd(), 'temp', uuid);
    await copyDirectoryContents(srcDir, destDir);
    await savePropDefinitions(uuid);
    await savePlacemarkXml(uuid);
    await modifyCsv(uuid);
    await generateCepFile(uuid);
  } catch (error) {
    console.error('Error creating the Collect Earth project:', error);
    throw error;
  }
}

// Function to read CSV and return it as an array of objects
function readCsv(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve(results);
      })
      .on('error', (err) => reject(err));
  });
}

// Function to write modified data to a new CSV file
function writeCsv(data: any[], outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    stringify(data, { header: true }, (err: any, output: any) => {
      if (err) {
        reject(err);
        return;
      }
      fs.writeFile(outputPath, output, (err: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  });
}
