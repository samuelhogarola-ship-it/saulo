(function () {
  function createAppRefs(root = document) {
    return {
      statusBanner: root.querySelector('#status-banner'),
      topbarTitle: root.querySelector('#topbar-title'),
      contextNav: root.querySelector('#context-nav'),
      studentName: root.querySelector('#student-name'),
      studentPlan: root.querySelector('#student-plan'),
      studentSummary: root.querySelector('#student-summary'),
      sideLinks: [...root.querySelectorAll('.side-link')],
      sectionPanels: [...root.querySelectorAll('[data-section-panel]')],
      routineDayLabel: root.querySelector('#routine-day-label'),
      routineDayTitle: root.querySelector('#routine-day-title'),
      routineDayMeta: root.querySelector('#routine-day-meta'),
      exerciseList: root.querySelector('#exercise-list'),
      completeWorkoutButton: root.querySelector('#complete-workout-button'),
      workoutModalRoot: root.querySelector('#workout-modal-root'),
      messagesInbox: root.querySelector('#messages-inbox'),
      messagesSent: root.querySelector('#messages-sent'),
      messagesReminders: root.querySelector('#messages-reminders'),
      messagePanels: [...root.querySelectorAll('[data-message-panel]')],
      messageComposeForm: root.querySelector('#message-compose-form'),
      messageComposeSubject: root.querySelector('#message-compose-subject'),
      messageComposeBody: root.querySelector('#message-compose-body'),
      supportChatTrigger: root.querySelector('#support-chat-trigger'),
      profilePhotosGallery: root.querySelector('#profile-photos-gallery'),
      subscriptionStartCard: root.querySelector('#subscription-start-card'),
      subscriptionPlanCard: root.querySelector('#subscription-plan-card'),
      subscriptionEndCard: root.querySelector('#subscription-end-card'),
      profileAgeCard: root.querySelector('#profile-age-card'),
      profileWeightCard: root.querySelector('#profile-weight-card'),
      profileGoalCard: root.querySelector('#profile-goal-card'),
      profileNotesCard: root.querySelector('#profile-photos-card')
        ?.previousElementSibling,
    };
  }

  window.SauloRefs = {
    createAppRefs,
  };
})();
