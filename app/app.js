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
const { escapeHtml } = window.SauloUtils;

const refs = {
  statusBanner: document.querySelector('#status-banner'),
  topbarTitle: document.querySelector('#topbar-title'),
  contextNav: document.querySelector('#context-nav'),
  studentName: document.querySelector('#student-name'),
  studentPlan: document.querySelector('#student-plan'),
  studentSummary: document.querySelector('#student-summary'),
  sideLinks: [...document.querySelectorAll('.side-link')],
  sectionPanels: [...document.querySelectorAll('[data-section-panel]')],
  routineDayLabel: document.querySelector('#routine-day-label'),
  routineDayTitle: document.querySelector('#routine-day-title'),
  routineDayMeta: document.querySelector('#routine-day-meta'),
  exerciseList: document.querySelector('#exercise-list'),
  completeWorkoutButton: document.querySelector('#complete-workout-button'),
  workoutModalRoot: document.querySelector('#workout-modal-root'),
  messagesInbox: document.querySelector('#messages-inbox'),
  messagesSent: document.querySelector('#messages-sent'),
  messagesReminders: document.querySelector('#messages-reminders'),
  messagePanels: [...document.querySelectorAll('[data-message-panel]')],
  messageComposeForm: document.querySelector('#message-compose-form'),
  messageComposeSubject: document.querySelector('#message-compose-subject'),
  messageComposeBody: document.querySelector('#message-compose-body'),
  supportChatTrigger: document.querySelector('#support-chat-trigger'),
  profilePhotosGallery: document.querySelector('#profile-photos-gallery'),
  subscriptionStartCard: document.querySelector('#subscription-start-card'),
  subscriptionPlanCard: document.querySelector('#subscription-plan-card'),
  subscriptionEndCard: document.querySelector('#subscription-end-card'),
  profileAgeCard: document.querySelector('#profile-age-card'),
  profileWeightCard: document.querySelector('#profile-weight-card'),
  profileGoalCard: document.querySelector('#profile-goal-card'),
  profileNotesCard: document.querySelector('#profile-photos-card')
    ?.previousElementSibling,
};

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
  refs,
  escapeHtml,
});

appController.bind();
appController.boot();
