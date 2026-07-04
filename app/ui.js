(function () {
  function renderLoadingState({ studentName, studentPlan, studentSummary }) {
    studentName.textContent = 'Cargando acceso';
    studentPlan.textContent = 'Saulo Fitness APP';
    studentSummary.textContent = 'Preparando tu panel.';
  }

  function renderErrorState({
    studentName,
    studentPlan,
    studentSummary,
    topbarTitle,
    contextNav,
    exerciseList,
    messagesInbox,
    messagesSent,
    messagesReminders,
  }) {
    studentName.textContent = 'Acceso requerido';
    studentPlan.textContent = 'Saulo Fitness APP';
    studentSummary.textContent = 'Solicita un enlace activo a tu entrenador.';
    topbarTitle.textContent = 'Acceso no disponible';
    contextNav.innerHTML = '';
    exerciseList.innerHTML = '';
    [messagesInbox, messagesSent, messagesReminders].forEach((container) => {
      if (container) {
        container.innerHTML = '';
      }
    });
  }

  function renderStudentBattery({ batteryByDay, day, studentSummary }) {
    const battery = batteryByDay[day] ?? batteryByDay[1];
    studentSummary.textContent = battery.note;
  }

  function updateSectionNavigation({ state, sideLinks, sectionPanels }) {
    sideLinks.forEach((link) => {
      link.classList.toggle(
        'is-active',
        link.dataset.section === state.section,
      );
    });

    sectionPanels.forEach((panel) => {
      panel.classList.toggle(
        'is-active',
        panel.dataset.sectionPanel === state.section,
      );
    });
  }

  function updateTopCopy({ state, topbarTitle }) {
    const titles = {
      routines: 'Rutinas del alumno',
      messages: 'Mensajes',
      subscription: 'Suscripción',
      profile: 'Perfil',
    };

    topbarTitle.textContent = titles[state.section];
  }

  function renderContextNav({
    state,
    contextNav,
    options,
    escapeHtml,
    onOptionSelect,
  }) {
    if (!contextNav || !options.length) {
      return;
    }

    contextNav.innerHTML = options
      .map(
        (option) => `
          <button
            class="context-chip ${option.key === state.contextKey ? 'is-active' : ''}"
            data-context-key="${escapeHtml(option.key)}"
          >
            ${escapeHtml(option.label)}
          </button>
        `,
      )
      .join('');

    [...contextNav.querySelectorAll('[data-context-key]')].forEach((button) => {
      button.addEventListener('click', () => {
        const nextKey = button.dataset.contextKey;
        const nextOption = options.find((option) => option.key === nextKey);

        if (nextOption) {
          onOptionSelect(nextOption);
        }
      });
    });
  }

  function renderProductStatus({ statusBanner, appError, escapeHtml }) {
    if (!statusBanner) {
      return;
    }

    if (!appError) {
      statusBanner.hidden = true;
      statusBanner.textContent = '';
      return;
    }

    statusBanner.hidden = false;
    statusBanner.innerHTML = `
      <strong>Acceso no disponible.</strong>
      <p>${escapeHtml(appError)}</p>
    `;
  }

  window.SauloUi = {
    renderContextNav,
    renderErrorState,
    renderLoadingState,
    renderProductStatus,
    renderStudentBattery,
    updateSectionNavigation,
    updateTopCopy,
  };
})();
