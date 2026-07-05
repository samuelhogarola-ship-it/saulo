(function () {
  function createTrainerRefs(root = document) {
    return {
      authForm: root.querySelector('#trainer-auth-form'),
      emailInput: root.querySelector('#trainer-email'),
      passwordInput: root.querySelector('#trainer-password'),
      logoutButton: root.querySelector('#trainer-logout'),
      statusBanner: root.querySelector('#trainer-status'),
      trainerIdentity: root.querySelector('#trainer-identity'),
      createStudentForm: root.querySelector('#student-create-form'),
      refreshButton: root.querySelector('#students-refresh-button'),
      studentsList: root.querySelector('#students-list'),
      summaryGroups: [...root.querySelectorAll('.students-summary')],
      studentsSearch: root.querySelector('#students-search'),
      studentsStatusFilter: root.querySelector('#students-status-filter'),
      studentsPlanFilter: root.querySelector('#students-plan-filter'),
      studentsSort: root.querySelector('#students-sort'),
      summaryTotal: root.querySelector('#summary-total'),
      summaryPaid: root.querySelector('#summary-paid'),
      summaryPending: root.querySelector('#summary-pending'),
      summaryActive: root.querySelector('#summary-active'),
      opsPendingPayment: root.querySelector('#ops-pending-payment'),
      opsReady: root.querySelector('#ops-ready'),
      opsSent: root.querySelector('#ops-sent'),
      opsOpened: root.querySelector('#ops-opened'),
      opsAttention: root.querySelector('#ops-attention'),
      studentCardTemplate: root.querySelector('#student-card-template'),
    };
  }

  window.SauloTrainerRefs = {
    createTrainerRefs,
  };
})();
