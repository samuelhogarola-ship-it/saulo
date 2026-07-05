(function () {
  function createAppBindings({
    api,
    chat,
    sections,
    routines,
    refs,
    state,
    getDefaultContextKey,
    getRoutinesByDay,
    renderApp,
  }) {
    function bind() {
      bindSectionNavigation();
      bindMessageComposer();
      bindSupportChat();
      bindProfilePhotoUploads();
      bindRoutineInteractions();
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
          renderApp();
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
          renderApp();
          return;
        }

        if (refs.messageComposeForm instanceof HTMLFormElement) {
          refs.messageComposeForm.reset();
        }

        state.section = 'messages';
        state.contextKey = 'messages-sent';
        renderApp();
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
        renderApp,
      });
    }

    function bindRoutineInteractions() {
      routines.bindRoutineInteractions({
        completeWorkoutButton: refs.completeWorkoutButton,
        exerciseList: refs.exerciseList,
        workoutModalRoot: refs.workoutModalRoot,
        state,
        routinesByDay: getRoutinesByDay(),
        exerciseChecks: state.exerciseChecks,
        renderApp,
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

    return {
      bind,
    };
  }

  window.SauloControllerBindings = {
    createAppBindings,
  };
})();
