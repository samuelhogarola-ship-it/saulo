(function () {
  const { escapeHtml, getSentMessageDate, getYoutubeEmbedUrl } =
    window.SauloUtils;

  function renderRoutine({
    state,
    routinesByDay,
    exerciseList,
    routineDayLabel,
    routineDayTitle,
    routineDayMeta,
    report,
    exerciseChecks,
  }) {
    const routine = routinesByDay[state.day] || routinesByDay[1];

    if (!routine || !exerciseList) {
      return;
    }

    routineDayLabel.textContent = routine.label;
    routineDayTitle.textContent = routine.title;
    routineDayMeta.textContent = routine.meta;

    exerciseList.innerHTML = routine.exercises
      .map(
        (exercise, index) => `
          <article class="exercise-card" data-exercise-name="${escapeHtml(exercise.name)}">
            <div class="exercise-top">
              <div>
                <p class="brand-kicker">Ejercicio ${index + 1}</p>
                <h5>${escapeHtml(exercise.name)}</h5>
                ${
                  exercise.videoUrl
                    ? '<p class="exercise-video-note">Video disponible en este ejercicio</p>'
                    : ''
                }
              </div>
              <button
                class="exercise-video ${exercise.videoUrl ? 'is-clickable' : ''}"
                type="button"
                ${exercise.videoUrl ? `data-video-url="${escapeHtml(exercise.videoUrl)}" data-video-title="${escapeHtml(exercise.name)}"` : 'disabled aria-disabled="true"'}
              >
                <img
                  class="exercise-video-image"
                  src="${getExerciseThumbnailSrc(exercise.name, routine.title)}"
                  alt="Vista previa del ejercicio ${escapeHtml(exercise.name)}"
                />
                <div class="exercise-video-overlay" aria-hidden="true">
                  ${
                    exercise.videoUrl
                      ? '<span class="exercise-video-status">Video disponible</span>'
                      : ''
                  }
                  <span class="exercise-video-play"></span>
                  <span class="exercise-video-label">Ver vídeo</span>
                </div>
              </button>
            </div>

            <div class="exercise-spec-grid">
              <div class="exercise-spec">
                Repeticiones
                <strong>${escapeHtml(exercise.reps)}</strong>
              </div>
              <div class="exercise-spec">
                Peso / %
                <strong>${escapeHtml(exercise.load)}</strong>
              </div>
              <div class="exercise-spec">
                Descanso
                <strong>${escapeHtml(exercise.rest)}</strong>
              </div>
            </div>

            <label class="exercise-check">
              <input
                class="exercise-check-input"
                type="checkbox"
                data-exercise-check="${escapeHtml(exercise.name)}"
                ${isExerciseChecked(exerciseChecks, state.day, exercise.name) ? 'checked' : ''}
              />
              <span class="exercise-check-box" aria-hidden="true"></span>
              <span class="exercise-check-label">Hecho</span>
            </label>

            <textarea
              class="exercise-comment"
              placeholder="Comentario de este ejercicio para guardarlo al finalizar..."
            >${getExistingComment(report, exercise.name)}</textarea>
          </article>
        `,
      )
      .join('');
  }

  function bindRoutineInteractions({
    completeWorkoutButton,
    exerciseList,
    workoutModalRoot,
    state,
    routinesByDay,
    exerciseChecks,
    renderApp,
    createWorkoutReport,
  }) {
    completeWorkoutButton?.addEventListener('click', () => {
      renderWorkoutModal(workoutModalRoot);
    });

    exerciseList?.addEventListener('click', (event) => {
      const videoButton = event.target?.closest?.('[data-video-url]');

      if (!videoButton) {
        return;
      }

      const videoUrl = videoButton.dataset.videoUrl;
      const videoTitle =
        videoButton.dataset.videoTitle || 'Video del ejercicio';

      if (!videoUrl) {
        return;
      }

      renderVideoModal(workoutModalRoot, videoTitle, videoUrl);
    });

    exerciseList?.addEventListener('change', (event) => {
      const checkInput = event.target?.closest?.('[data-exercise-check]');

      if (!(checkInput instanceof HTMLInputElement)) {
        return;
      }

      setExerciseChecked(
        exerciseChecks,
        state.day,
        checkInput.dataset.exerciseCheck,
        checkInput.checked,
      );
    });

    workoutModalRoot?.addEventListener('click', (event) => {
      const feedbackButton = event.target?.closest?.('[data-workout-feedback]');
      if (feedbackButton) {
        const feedback = feedbackButton.dataset.workoutFeedback;
        closeWorkoutModal(workoutModalRoot);
        if (feedback) {
          buildWorkoutReport({
            feedback,
            state,
            routinesByDay,
            exerciseList,
            exerciseChecks,
            renderApp,
            createWorkoutReport,
          });
        }
        return;
      }

      if (event.target?.matches?.('[data-close-workout-modal]')) {
        closeWorkoutModal(workoutModalRoot);
        return;
      }

      if (event.target === workoutModalRoot) {
        closeWorkoutModal(workoutModalRoot);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !workoutModalRoot?.hidden) {
        closeWorkoutModal(workoutModalRoot);
      }
    });
  }

  function renderWorkoutModal(workoutModalRoot) {
    if (!workoutModalRoot) {
      return;
    }

    workoutModalRoot.hidden = false;
    workoutModalRoot.innerHTML = `
      <div class="workout-modal" role="dialog" aria-modal="true" aria-labelledby="workout-modal-title">
        <button class="workout-modal-close" type="button" data-close-workout-modal aria-label="Cerrar">
          ×
        </button>
        <p class="brand-kicker">Rutina completada</p>
        <h3 id="workout-modal-title">¿Qué tal fue la rutina?</h3>
        <p>Elige cómo te ha ido para dejarlo registrado en el informe del entrenamiento.</p>
        <div class="workout-modal-actions">
          <button class="complete-button" type="button" data-workout-feedback="Bien">
            Bien
          </button>
          <button class="complete-button" type="button" data-workout-feedback="Regular">
            Regular
          </button>
          <button class="complete-button" type="button" data-workout-feedback="Intensa">
            Intensa
          </button>
        </div>
      </div>
    `;
  }

  function renderVideoModal(workoutModalRoot, title, videoUrl) {
    if (!workoutModalRoot) {
      return;
    }

    const embedUrl = getYoutubeEmbedUrl(videoUrl);

    if (!embedUrl) {
      window.alert('No se pudo abrir este video.');
      return;
    }

    workoutModalRoot.hidden = false;
    workoutModalRoot.innerHTML = `
      <div class="workout-modal workout-modal-video" role="dialog" aria-modal="true" aria-labelledby="video-modal-title">
        <button class="workout-modal-close" type="button" data-close-workout-modal aria-label="Cerrar">
          ×
        </button>
        <p class="brand-kicker">Video del ejercicio</p>
        <h3 id="video-modal-title">${escapeHtml(title)}</h3>
        <div class="video-frame">
          <iframe
            src="${escapeHtml(embedUrl)}"
            title="${escapeHtml(title)}"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
            referrerpolicy="strict-origin-when-cross-origin"
          ></iframe>
        </div>
      </div>
    `;
  }

  function closeWorkoutModal(workoutModalRoot) {
    if (!workoutModalRoot) {
      return;
    }

    workoutModalRoot.hidden = true;
    workoutModalRoot.innerHTML = '';
  }

  async function buildWorkoutReport({
    feedback,
    state,
    routinesByDay,
    exerciseList,
    exerciseChecks,
    renderApp,
    createWorkoutReport,
  }) {
    const activeRoutine = routinesByDay[state.day];
    const exerciseCards = [
      ...exerciseList.querySelectorAll('[data-exercise-name]'),
    ];
    const notes = exerciseCards.map((card) => {
      const name = card.dataset.exerciseName;
      const textarea = card.querySelector('textarea');
      const comment = textarea ? textarea.value.trim() : '';
      const done = isExerciseChecked(exerciseChecks, state.day, name);
      return {
        name,
        done,
        comment: comment || 'Sin comentario',
      };
    });

    const report = {
      title: 'Resumen de entrenamiento',
      meta: `${activeRoutine.title} · ${feedback.toLowerCase()}`,
      day: state.day,
      feedback,
      notes,
    };
    const summary = `${activeRoutine.label} · ${activeRoutine.title} · ${feedback}. ${notes
      .map(
        (item) =>
          `${item.name} (${item.done ? 'hecho' : 'pendiente'}): ${item.comment}`,
      )
      .join(' | ')}`;

    try {
      await createWorkoutReport({
        day: state.day,
        feedback,
        exercises: notes,
        summary,
      });
    } catch (error) {
      state.appError = error.message;
      renderApp();
      return;
    }

    state.report = report;

    state.messages.sent.unshift({
      title: 'Resumen de entrenamiento',
      tag: 'Enviado',
      date: getSentMessageDate(),
      source: 'App',
      body: summary,
    });

    state.section = 'messages';
    state.contextKey = 'messages-sent';
    renderApp();
  }

  function getExerciseThumbnailSrc(exerciseName, routineTitle) {
    const theme = getExerciseThumbnailTheme(exerciseName);
    const safeExerciseName = escapeHtml(exerciseName);
    const safeRoutineTitle = escapeHtml(routineTitle);
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" role="img" aria-label="${safeExerciseName}">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#111114" />
            <stop offset="55%" stop-color="#1a1a20" />
            <stop offset="100%" stop-color="#060608" />
          </linearGradient>
          <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${theme.glow}" stop-opacity="0.9" />
            <stop offset="100%" stop-color="${theme.glowSecondary}" stop-opacity="0.15" />
          </linearGradient>
        </defs>
        <rect width="320" height="180" rx="24" fill="url(#bg)" />
        <circle cx="74" cy="54" r="58" fill="url(#glow)" opacity="0.55" />
        <circle cx="262" cy="34" r="40" fill="${theme.glowSecondary}" opacity="0.16" />
        <rect x="0" y="138" width="320" height="42" fill="#0c0c0f" />
        <rect x="22" y="138" width="276" height="2" fill="rgba(255,255,255,0.08)" />
        ${theme.scene}
        <rect x="18" y="18" width="112" height="24" rx="12" fill="rgba(255,255,255,0.08)" />
        <text x="32" y="34" fill="#ffffff" font-size="12" font-family="Arial, sans-serif" font-weight="700">${safeRoutineTitle}</text>
        <rect x="18" y="146" width="158" height="20" rx="10" fill="rgba(255,255,255,0.08)" />
        <text x="30" y="160" fill="#ffffff" font-size="12" font-family="Arial, sans-serif" font-weight="700">${safeExerciseName}</text>
      </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function getExerciseThumbnailTheme(exerciseName) {
    const name = exerciseName.toLowerCase();

    if (
      name.includes('sentadilla') ||
      name.includes('hip thrust') ||
      name.includes('peso muerto')
    ) {
      return {
        glow: '#7c4dff',
        glowSecondary: '#ffffff',
        scene: `
          <rect x="198" y="64" width="6" height="70" rx="3" fill="#2b2b31" />
          <rect x="118" y="102" width="104" height="6" rx="3" fill="#d8d8de" />
          <rect x="104" y="96" width="12" height="18" rx="4" fill="#5a5a65" />
          <rect x="224" y="96" width="12" height="18" rx="4" fill="#5a5a65" />
          <circle cx="152" cy="74" r="12" fill="#f3d7c4" />
          <rect x="144" y="86" width="20" height="28" rx="10" fill="#1d4ed8" />
          <rect x="133" y="92" width="16" height="10" rx="5" fill="#f3d7c4" />
          <rect x="159" y="92" width="26" height="8" rx="4" fill="#f3d7c4" />
          <rect x="146" y="112" width="8" height="24" rx="4" fill="#f3d7c4" />
          <rect x="157" y="112" width="8" height="24" rx="4" fill="#f3d7c4" />
        `,
      };
    }

    if (
      name.includes('jalón') ||
      name.includes('remo') ||
      name.includes('curl')
    ) {
      return {
        glow: '#8b5cf6',
        glowSecondary: '#60a5fa',
        scene: `
          <rect x="214" y="34" width="8" height="102" rx="4" fill="#2d2d34" />
          <rect x="196" y="46" width="44" height="6" rx="3" fill="#4a4a53" />
          <rect x="214" y="52" width="2" height="24" fill="#b9b9c5" />
          <rect x="206" y="76" width="18" height="4" rx="2" fill="#d9d9e0" />
          <circle cx="140" cy="72" r="12" fill="#f3d7c4" />
          <rect x="132" y="84" width="20" height="30" rx="10" fill="#2563eb" />
          <rect x="144" y="114" width="8" height="24" rx="4" fill="#f3d7c4" />
          <rect x="156" y="90" width="36" height="8" rx="4" fill="#f3d7c4" />
          <rect x="131" y="95" width="18" height="8" rx="4" fill="#f3d7c4" />
        `,
      };
    }

    if (name.includes('press')) {
      return {
        glow: '#6d28d9',
        glowSecondary: '#93c5fd',
        scene: `
          <rect x="92" y="112" width="120" height="8" rx="4" fill="#3c3c45" />
          <rect x="110" y="96" width="48" height="12" rx="6" fill="#4f4f58" />
          <rect x="126" y="90" width="84" height="6" rx="3" fill="#dadbe1" />
          <rect x="116" y="84" width="12" height="18" rx="4" fill="#61616c" />
          <rect x="210" y="84" width="12" height="18" rx="4" fill="#61616c" />
          <circle cx="150" cy="74" r="11" fill="#f3d7c4" />
          <rect x="142" y="84" width="20" height="22" rx="10" fill="#2563eb" />
          <rect x="135" y="93" width="16" height="8" rx="4" fill="#f3d7c4" />
          <rect x="160" y="93" width="18" height="8" rx="4" fill="#f3d7c4" />
        `,
      };
    }

    return {
      glow: '#7c3aed',
      glowSecondary: '#34d399',
      scene: `
        <circle cx="148" cy="74" r="12" fill="#f3d7c4" />
        <rect x="140" y="86" width="20" height="32" rx="10" fill="#2563eb" />
        <rect x="129" y="92" width="16" height="8" rx="4" fill="#f3d7c4" />
        <rect x="156" y="92" width="18" height="8" rx="4" fill="#f3d7c4" />
        <rect x="144" y="118" width="8" height="18" rx="4" fill="#f3d7c4" />
        <rect x="154" y="118" width="8" height="18" rx="4" fill="#f3d7c4" />
        <rect x="196" y="92" width="44" height="8" rx="4" fill="#3f3f47" />
        <rect x="84" y="104" width="50" height="8" rx="4" fill="#3f3f47" />
      `,
    };
  }

  function getExistingComment(report, exerciseName) {
    if (!report) {
      return '';
    }

    const previousNote = report.notes.find(
      (note) => note.name === exerciseName,
    );
    return previousNote ? previousNote.comment : '';
  }

  function getExerciseCheckKey(day, exerciseName) {
    return `${day}:${exerciseName}`;
  }

  function isExerciseChecked(exerciseChecks, day, exerciseName) {
    return exerciseChecks[getExerciseCheckKey(day, exerciseName)] === true;
  }

  function setExerciseChecked(exerciseChecks, day, exerciseName, checked) {
    if (!exerciseName) {
      return;
    }

    exerciseChecks[getExerciseCheckKey(day, exerciseName)] = checked;
  }

  window.SauloRoutines = {
    bindRoutineInteractions,
    renderRoutine,
  };
})();
