const {
  createBatteryByDay,
  createInitialRoutinesByDay,
  createInitialState,
  createInitialStudentProfile,
  applyProductData: applyProductDataToState,
  applyRoutineData: applyRoutineDataToState,
  loadProductData: loadProductDataFromApi,
} = window.SauloState;
const {
  contextOptionsBySection,
  getDefaultContextKey,
  hydrateStateFromUrl: hydrateStateFromNavigation,
  syncUrlState,
} = window.SauloNavigation;
const { createAppRefs } = window.SauloRefs;
const { escapeHtml } = window.SauloUtils;

const appController = window.SauloController.createAppController({
  api: window.SauloApi,
  chat: window.SauloChat,
  pwa: window.SauloPwa,
  state: createInitialState(),
  batteryByDay: createBatteryByDay(),
  initialStudentProfile: createInitialStudentProfile(),
  initialRoutinesByDay: createInitialRoutinesByDay(),
  contextOptionsBySection,
  getDefaultContextKey,
  hydrateStateFromNavigation,
  syncUrlState,
  applyProductDataToState,
  applyRoutineDataToState,
  loadProductDataFromApi,
  ui: window.SauloUi,
  sections: window.SauloSections,
  routines: window.SauloRoutines,
  refs: createAppRefs(),
  escapeHtml,
});

appController.bind();
appController.boot();
