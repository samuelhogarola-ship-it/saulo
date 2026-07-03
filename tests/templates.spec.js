const { test, expect } = require('@playwright/test');

const {
  loadStudentTemplate,
  validateStudentTemplate,
} = require('../lib/product-student-template');
const { projectRoot } = require('../lib/config');

test('validates the shipped Lucía Ortega student template', () => {
  const template = loadStudentTemplate(
    projectRoot,
    'product-templates/students/lucia-ortega.json',
  );
  const result = validateStudentTemplate(template);

  expect(result.errors).toEqual([]);
  expect(result.routineDays).toBe(7);
  expect(result.messageCount).toBeGreaterThan(0);
  expect(result.photoSlotCount).toBe(4);
});

test('detects invalid student templates before bootstrap', () => {
  const invalidTemplate = {
    name: '',
    contactEmail: '',
    routineBlueprint: [
      { day_number: 1, title: 'Día 1', exercises: [{ name: 'Algo' }] },
      { day_number: 1, title: 'Día 1 repetido', exercises: [] },
    ],
    initialMessages: [
      {
        direction: 'unknown',
        title: 'Bad',
        body: '',
      },
    ],
    photoSlots: [
      ['front', 'Frente'],
      ['front', 'Frente otra vez'],
    ],
  };

  const result = validateStudentTemplate(invalidTemplate);

  expect(result.errors).toEqual(
    expect.arrayContaining([
      expect.stringContaining('Falta `name`'),
      expect.stringContaining('Falta `contactEmail`'),
      expect.stringContaining('días duplicados'),
      expect.stringContaining('dirección no válida'),
      expect.stringContaining('no tiene body'),
      expect.stringContaining('duplicados'),
    ]),
  );
});
