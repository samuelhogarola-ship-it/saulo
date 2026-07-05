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
    let renderer;
    let bindings;

    function bind() {
      ensureBindings().bind();
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
      ensureRenderer().render();
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

    function ensureBindings() {
      if (!bindings) {
        bindings = window.SauloControllerBindings.createAppBindings({
          api,
          chat,
          sections,
          routines,
          refs,
          state,
          getDefaultContextKey,
          getRoutinesByDay: () => routinesByDay,
          renderApp: render,
        });
      }

      return bindings;
    }

    function ensureRenderer() {
      if (!renderer) {
        renderer = window.SauloControllerRenderer.createAppRenderer({
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
          getStudentProfile: () => studentProfile,
          getRoutinesByDay: () => routinesByDay,
          applyRoutineData,
        });
      }

      return renderer;
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
