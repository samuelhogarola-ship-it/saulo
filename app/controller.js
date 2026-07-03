(function () {
  function createAppController({
    api,
    chat,
    pwa,
    state,
    batteryByDay,
    initialStudentProfile,
    initialRoutinesByDay,
    contextOptionsBySection,
    getDefaultContextKey,
    hydrateStateFromNavigation,
    syncUrlState,
    applyProductDataToState,
    applyRoutineDataToState,
    loadProductDataFromApi,
    ui,
    sections,
    routines,
    refs,
    escapeHtml,
  }) {
    let studentProfile = initialStudentProfile;
    let routinesByDay = initialRoutinesByDay;

    function bind() {
      bindSectionNavigation();
      bindMessageComposer();
      bindSupportChat();
      bindProfilePhotoUploads();
      bindRoutineInteractions();
    }

    async function boot() {
      hydrateStateFromUrl();

      try {
        await loadProductData();
        await registerServiceWorker();
        state.appError = null;
      } catch (error) {
        state.appError = error.message;
      } finally {
        state.isLoading = false;
      }

      render();
    }

    async function loadProductData() {
      const data = await loadProductDataFromApi(state.day);
      applyProductData(data);
    }

    function applyProductData(data) {
      const next = applyProductDataToState({
        studentProfile,
        state,
        routinesByDay,
        data,
        getAccessToken: api.getAccessToken,
      });
      studentProfile = next.studentProfile;
      routinesByDay = next.routinesByDay;
      Object.assign(state, next.state);
    }

    function applyRoutineData(routineData) {
      routinesByDay = applyRoutineDataToState(routinesByDay, routineData);
    }

    function render() {
      if (state.isLoading) {
        ui.renderLoadingState({
          studentName: refs.studentName,
          studentPlan: refs.studentPlan,
          studentSummary: refs.studentSummary,
        });
        return;
      }

      if (state.appError) {
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
        return;
      }

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

    function bindSectionNavigation() {
      refs.sideLinks.forEach((button) => {
        button.addEventListener('click', () => {
          const nextSection = button.dataset.section;

          if (!nextSection) {
            return;
          }

          state.section = nextSection;
          state.contextKey = getDefaultContextKey(nextSection);
          render();
        });
      });
    }

    function bindMessageComposer() {
      refs.messageComposeForm?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const subject = refs.messageComposeSubject?.value.trim();
        const body = refs.messageComposeBody?.value.trim();

        if (!subject || !body) {
          return;
        }

        try {
          const result = await api.sendMessage({ title: subject, body });
          state.messages.sent.unshift(result.message);
        } catch (error) {
          state.appError = error.message;
          render();
          return;
        }

        if (refs.messageComposeForm instanceof HTMLFormElement) {
          refs.messageComposeForm.reset();
        }

        state.section = 'messages';
        state.contextKey = 'messages-sent';
        render();
      });
    }

    function bindSupportChat() {
      refs.supportChatTrigger?.addEventListener('click', (event) => {
        event.preventDefault();
        chat.requestSupportChat();
        openSupportChat();
      });
    }

    function bindProfilePhotoUploads() {
      sections.bindProfilePhotoUploads({
        profilePhotosGallery: refs.profilePhotosGallery,
        state,
        uploadProgressPhoto: api.uploadProgressPhoto,
        renderApp: render,
      });
    }

    function bindRoutineInteractions() {
      routines.bindRoutineInteractions({
        completeWorkoutButton: refs.completeWorkoutButton,
        exerciseList: refs.exerciseList,
        workoutModalRoot: refs.workoutModalRoot,
        state,
        routinesByDay,
        exerciseChecks: state.exerciseChecks,
        renderApp: render,
        createWorkoutReport: api.createWorkoutReport,
      });
    }

    async function openSupportChat() {
      try {
        await chat.openSupportChat();
      } catch (error) {
        console.warn('No se pudo abrir Chatbase', error);
        window.alert(
          'El chat se está cargando. Prueba de nuevo en unos segundos.',
        );
      }
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
        routinesByDay,
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
        studentProfile,
        profileAgeCard: refs.profileAgeCard,
        profileWeightCard: refs.profileWeightCard,
        profileGoalCard: refs.profileGoalCard,
        profileNotesCard: refs.profileNotesCard,
      });
    }

    function renderProfilePhotos() {
      sections.renderProfilePhotos({
        state,
        studentProfile,
        profilePhotosGallery: refs.profilePhotosGallery,
      });
    }

    async function registerServiceWorker() {
      if (!pwa) {
        return;
      }

      await pwa.registerAppServiceWorker();
    }

    function hydrateStateFromUrl() {
      const nextState = hydrateStateFromNavigation(
        state,
        Object.keys(routinesByDay).map(Number),
      );
      Object.assign(state, nextState);
    }

    return {
      bind,
      boot,
      render,
    };
  }

  window.SauloController = {
    createAppController,
  };
})();
