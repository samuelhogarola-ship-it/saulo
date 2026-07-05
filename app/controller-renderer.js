(function () {
  function createAppRenderer({
    api,
    chat,
    ui,
    sections,
    routines,
    refs,
    state,
    batteryByDay,
    contextOptionsBySection,
    escapeHtml,
    syncUrlState,
    getStudentProfile,
    getRoutinesByDay,
    applyRoutineData,
  }) {
    function render() {
      if (state.isLoading) {
        renderLoadingState();
        return;
      }

      if (state.appError) {
        renderErrorState();
        return;
      }

      renderReadyState();
    }

    function renderLoadingState() {
      ui.renderLoadingState({
        studentName: refs.studentName,
        studentPlan: refs.studentPlan,
        studentSummary: refs.studentSummary,
      });
    }

    function renderErrorState() {
      ui.renderErrorState({
        studentName: refs.studentName,
        studentPlan: refs.studentPlan,
        studentSummary: refs.studentSummary,
        topbarTitle: refs.topbarTitle,
        contextNav: refs.contextNav,
        exerciseList: refs.exerciseList,
        messagesInbox: refs.messagesInbox,
        messagesSent: refs.messagesSent,
        messagesReminders: refs.messagesReminders,
      });
      renderProductStatus();
      syncUrlState(state);
    }

    function renderReadyState() {
      const studentProfile = getStudentProfile();

      refs.studentName.textContent = studentProfile.name;
      refs.studentPlan.textContent = studentProfile.plan;
      renderStudentBattery();

      renderProductStatus();
      updateSectionNavigation();
      updateTopCopy();
      renderContextNav();
      renderRoutine();
      renderMessages();
      renderSubscription();
      renderProfile();
      renderProfilePhotos();
      chat.syncVisibility(state);
      syncUrlState(state);
    }

    function renderStudentBattery() {
      ui.renderStudentBattery({
        batteryByDay,
        day: state.day,
        studentSummary: refs.studentSummary,
      });
    }

    function updateSectionNavigation() {
      ui.updateSectionNavigation({
        state,
        sideLinks: refs.sideLinks,
        sectionPanels: refs.sectionPanels,
      });
    }

    function updateTopCopy() {
      ui.updateTopCopy({ state, topbarTitle: refs.topbarTitle });
    }

    function renderContextNav() {
      const options = contextOptionsBySection[state.section] ?? [];

      if (!refs.contextNav || !options.length) {
        return;
      }

      if (state.section === 'routines') {
        state.contextKey = `day-${state.day}`;
      } else if (!options.some((option) => option.key === state.contextKey)) {
        state.contextKey = options[0].key;
      }

      ui.renderContextNav({
        state,
        contextNav: refs.contextNav,
        options,
        escapeHtml,
        onOptionSelect: async (nextOption) => {
          if (nextOption.type === 'day') {
            state.section = 'routines';
            state.day = nextOption.day;
            state.contextKey = nextOption.key;
            try {
              const routine = await api.getRoutine(state.day);
              applyRoutineData(routine);
              state.appError = null;
            } catch (error) {
              state.appError = error.message;
            }
            render();
            return;
          }

          state.contextKey = nextOption.key;
          render();

          if (nextOption.target) {
            window.requestAnimationFrame(() => {
              document.querySelector(nextOption.target)?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              });
            });
          }
        },
      });
    }

    function renderRoutine() {
      routines.renderRoutine({
        state,
        routinesByDay: getRoutinesByDay(),
        exerciseList: refs.exerciseList,
        routineDayLabel: refs.routineDayLabel,
        routineDayTitle: refs.routineDayTitle,
        routineDayMeta: refs.routineDayMeta,
        report: state.report,
        exerciseChecks: state.exerciseChecks,
      });
    }

    function renderProductStatus() {
      ui.renderProductStatus({
        statusBanner: refs.statusBanner,
        appError: state.appError,
        escapeHtml,
      });
    }

    function renderMessages() {
      sections.renderMessages({
        state,
        messagePanels: refs.messagePanels,
        messagesInbox: refs.messagesInbox,
        messagesSent: refs.messagesSent,
        messagesReminders: refs.messagesReminders,
        contextOptionsBySection,
      });
    }

    function renderSubscription() {
      sections.renderSubscription({
        state,
        subscriptionStartCard: refs.subscriptionStartCard,
        subscriptionPlanCard: refs.subscriptionPlanCard,
        subscriptionEndCard: refs.subscriptionEndCard,
      });
    }

    function renderProfile() {
      sections.renderProfile({
        studentProfile: getStudentProfile(),
        profileAgeCard: refs.profileAgeCard,
        profileWeightCard: refs.profileWeightCard,
        profileGoalCard: refs.profileGoalCard,
        profileNotesCard: refs.profileNotesCard,
      });
    }

    function renderProfilePhotos() {
      sections.renderProfilePhotos({
        state,
        studentProfile: getStudentProfile(),
        profilePhotosGallery: refs.profilePhotosGallery,
      });
    }

    return {
      render,
    };
  }

  window.SauloControllerRenderer = {
    createAppRenderer,
  };
})();
