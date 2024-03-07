import { promises as fs } from 'fs';
import path from 'path';
import { zip } from 'zip-a-folder';

async function savePropDefinitions(uuid: string): Promise<void> {
  const sourcePath = path.join(process.cwd(), 'public', 'collect-earth', 'project_definition.properties');
  try {
    const propString = await fs.readFile(sourcePath, 'utf8');

    const newPropString = propString.replace('survey_name=whisp', `survey_name=${uuid}`)
    const destPath = path.join(process.cwd(), 'temp', uuid, 'project_definition.properties');
    await fs.writeFile(destPath, newPropString);
    console.log('File saved successfully.');
  } catch (error) {
    console.error('Error reading or saving the file:', error);
    throw error;
  }
}

const savePlacemarkXml = async (uuid: string): Promise<void> => {
  const sourcePath = path.join(process.cwd(), 'public', 'collect-earth', 'placemark.idm.xml');
  try {
    const xmlString = await fs.readFile(sourcePath, 'utf8');
    const updatedXmlString = xmlString.replace('http://www.openforis.org/idm/whisp', `http://www.openforis.org/idm/${uuid}`);
    const savePath = path.join(process.cwd(), 'temp', uuid, 'updatedProject.xml');
    await fs.writeFile(savePath, updatedXmlString);
  } catch (error) {
    console.error('Error reading or saving the XML file:', error);
    throw error;
  }
}

const saveCsv = async (uuid: string): Promise<void> => {
  const savePath = path.join(process.cwd(), 'temp', uuid, 'plotsTest.csv');
  const sourceCsvPath = path.join(process.cwd(), 'temp', `${uuid}-result.csv`); 

  try {
    await fs.copyFile(sourceCsvPath, savePath);
  } catch (error) {
    throw error
  }
}


async function copyDirectoryContents(srcDir: string, destDir: string): Promise<void> {
  try {
    await fs.mkdir(destDir, { recursive: true });

    // Read the source directory contents
    const entries = await fs.readdir(srcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);

      if (entry.isDirectory()) {
        await copyDirectoryContents(srcPath, destPath);
      } else if (entry.isFile()) {
        await fs.copyFile(srcPath, destPath);
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
    await saveCsv(uuid);
    await generateCepFile(uuid);
  } catch (error) {
    console.error('Error creating the Collect Earth project:', error);
    throw error; 
  }
}
