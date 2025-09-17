const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const swaggerTemplatePath = path.join(__dirname, '..', 'public', 'swagger.template.json');
const swaggerOutputPath = path.join(__dirname, '..', 'public', 'swagger.json');

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version;
  
  let swaggerContent;
  
  if (fs.existsSync(swaggerTemplatePath)) {
    swaggerContent = JSON.parse(fs.readFileSync(swaggerTemplatePath, 'utf8'));
  } else {
    swaggerContent = JSON.parse(fs.readFileSync(swaggerOutputPath, 'utf8'));
  }
  
  swaggerContent.info.version = version;
  
  fs.writeFileSync(swaggerOutputPath, JSON.stringify(swaggerContent, null, 2));
  
  console.log(`✅ Swagger documentation updated with version ${version}`);
} catch (error) {
  console.error('❌ Error generating swagger.json:', error.message);
  process.exit(1);
}
