const steps = [...document.querySelectorAll('.step')];
const prevButton = document.querySelector('#prev-button');
const nextButton = document.querySelector('#next-button');
const submitButton = document.querySelector('#submit-button');
const form = document.querySelector('#questionnaire-form');
const progressBar = document.querySelector('#progress-bar');
const progressText = document.querySelector('#progress-text');
const submissionPanel = document.querySelector('#submission-panel');
const formTopbar = document.querySelector('.form-topbar');
const progressTrack = document.querySelector('.progress-track');
const stepsWindow = document.querySelector('.steps-window');
const formStatus = document.querySelector('#form-status');
const formPanel = document.querySelector('.form-panel');
const formConfig = window.SAULO_FORM_CONFIG || {};
const questionnaireEndpoint =
  formConfig.endpoint && typeof formConfig.endpoint === 'string'
    ? formConfig.endpoint
    : '/api/questionnaire';
const successMessage = 'Muchas gracias por la informacion. Nos vemos pronto!';

let currentStep = 0;
let isSubmitting = false;

function updateStep() {
  steps.forEach((step, index) => {
    step.classList.toggle('is-active', index === currentStep);
  });

  const stepNumber = currentStep + 1;
  const totalSteps = steps.length;
  const progress = (stepNumber / totalSteps) * 100;

  progressBar.style.width = `${progress}%`;
  progressText.textContent = `Paso ${stepNumber} de ${totalSteps}`;
  prevButton.disabled = currentStep === 0 || isSubmitting;
  nextButton.classList.toggle('is-hidden', currentStep === totalSteps - 1);
  submitButton.classList.toggle('is-hidden', currentStep !== totalSteps - 1);
  nextButton.disabled = isSubmitting;
  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting
    ? 'Enviando cuestionario...'
    : 'Enviar cuestionario';

  if (stepsWindow) {
    stepsWindow.scrollTo({ top: 0, behavior: 'smooth' });
  }

  focusCurrentStep();
}

prevButton.addEventListener('click', () => {
  currentStep = Math.max(0, currentStep - 1);
  updateStep();
});

nextButton.addEventListener('click', () => {
  currentStep = Math.min(steps.length - 1, currentStep + 1);
  updateStep();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  submitQuestionnaire();
});

updateStep();

function focusCurrentStep() {
  const activeStep = steps[currentStep];

  if (!activeStep) {
    return;
  }

  const firstFocusableField = activeStep.querySelector(
    'input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"]), textarea, select',
  );

  if (formPanel && window.innerWidth <= 768) {
    formPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (firstFocusableField) {
    window.setTimeout(() => {
      firstFocusableField.focus({ preventScroll: true });
    }, 180);
  }
}

async function submitQuestionnaire() {
  if (isSubmitting) {
    return;
  }

  isSubmitting = true;
  setFormStatus('', false);
  updateStep();

  try {
    const formData = new FormData(form);
    const response = await fetch(questionnaireEndpoint, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok) {
      throw new Error(
        result.message ||
          'No hemos podido enviar el cuestionario. Inténtalo de nuevo.',
      );
    }

    form.hidden = true;
    formTopbar.hidden = true;
    progressTrack.hidden = true;
    submissionPanel.hidden = false;
    window.alert(successMessage);
    submissionPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    setFormStatus(
      error.message ||
        'No hemos podido enviar el cuestionario. Inténtalo de nuevo.',
      true,
    );
  } finally {
    isSubmitting = false;
    updateStep();
  }
}

function setFormStatus(message, isError) {
  if (!message) {
    formStatus.hidden = true;
    formStatus.textContent = '';
    formStatus.classList.remove('is-error');
    return;
  }

  formStatus.hidden = false;
  formStatus.textContent = message;
  formStatus.classList.toggle('is-error', Boolean(isError));
}
