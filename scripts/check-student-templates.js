const fs = require('node:fs');
const path = require('node:path');

const { projectRoot } = require('../lib/config');
const {
  loadStudentTemplate,
  validateStudentTemplate,
} = require('../lib/product-student-template');

const templatesRoot = path.join(projectRoot, 'product-templates', 'students');

function main() {
  if (!fs.existsSync(templatesRoot)) {
    throw new Error('No existe product-templates/students.');
  }

  const files = findJsonFiles(templatesRoot);
  if (!files.length) {
    throw new Error('No se encontraron plantillas JSON de alumnos.');
  }

  let invalidCount = 0;

  console.log('Saulo Fitness APP · Student templates check');
  files.forEach((file) => {
    const relative = path.relative(projectRoot, file);
    const template = loadStudentTemplate(projectRoot, file);
    const result = validateStudentTemplate(template);

    if (result.errors.length) {
      invalidCount += 1;
      console.log(`- INVALID ${relative}`);
      result.errors.forEach((error) => console.log(`  · ${error}`));
      return;
    }

    console.log(
      `- OK ${relative} · días ${result.routineDays} · mensajes ${result.messageCount} · fotos ${result.photoSlotCount}`,
    );
    result.warnings.forEach((warning) =>
      console.log(`  · warning: ${warning}`),
    );
  });

  if (invalidCount) {
    throw new Error(`Hay ${invalidCount} plantilla(s) de alumno no válidas.`);
  }
}

function findJsonFiles(rootDir) {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const files = [];

  entries.forEach((entry) => {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findJsonFiles(fullPath));
      return;
    }

    if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  });

  return files.sort();
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
