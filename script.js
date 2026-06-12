const MAX_LOGO_SIZE_BYTES = 8 * 1024 * 1024;
const allowedLogoMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/svg+xml',
  'image/webp',
]);
const allowedLogoExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];

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
const logoInput = form?.querySelector('input[name="logoFile"]');
const formConfig = window.SAULO_FORM_CONFIG || {};
const questionnaireEndpoint =
  formConfig.endpoint && typeof formConfig.endpoint === 'string'
    ? formConfig.endpoint
    : '/api/questionnaire';
const successMessage =
  'Muchas gracias por la informacion. Hemos recibido tu cuestionario y te contactaremos pronto.';

let currentStep = 0;
let isSubmitting = false;

prevButton.addEventListener('click', () => {
  currentStep = Math.max(0, currentStep - 1);
  setFormStatus('', false);
  updateStep();
});

nextButton.addEventListener('click', () => {
  if (!validateCurrentStep()) {
    return;
  }

  currentStep = Math.min(steps.length - 1, currentStep + 1);
  setFormStatus('', false);
  updateStep();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!validateCurrentStep() || !validateLogoInput()) {
    return;
  }

  submitQuestionnaire();
});

logoInput?.addEventListener('change', () => {
  validateLogoInput();
});

updateStep();

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

function validateCurrentStep() {
  const activeStep = steps[currentStep];

  if (!activeStep) {
    return true;
  }

  if (!validateLogoInput()) {
    return false;
  }

  const controls = activeStep.querySelectorAll('input, textarea, select');

  for (const control of controls) {
    if (
      typeof control.checkValidity === 'function' &&
      !control.checkValidity()
    ) {
      control.reportValidity();
      setFormStatus(
        'Revisa los campos obligatorios antes de continuar con el siguiente bloque.',
        true,
      );
      return false;
    }
  }

  return true;
}

function validateLogoInput() {
  if (!logoInput || !logoInput.files || logoInput.files.length === 0) {
    if (logoInput) {
      logoInput.setCustomValidity('');
    }

    return true;
  }

  const [file] = logoInput.files;
  const normalizedName = file.name.toLowerCase();
  const hasAllowedExtension = allowedLogoExtensions.some((extension) =>
    normalizedName.endsWith(extension),
  );
  const hasAllowedMimeType =
    !file.type || allowedLogoMimeTypes.has(file.type.toLowerCase());

  if (!hasAllowedExtension || !hasAllowedMimeType) {
    logoInput.value = '';
    logoInput.setCustomValidity(
      'El logotipo debe estar en formato PNG, JPG, SVG o WEBP.',
    );
    logoInput.reportValidity();
    setFormStatus(
      'El logotipo debe estar en formato PNG, JPG, SVG o WEBP.',
      true,
    );
    return false;
  }

  if (file.size > MAX_LOGO_SIZE_BYTES) {
    logoInput.value = '';
    logoInput.setCustomValidity('El logotipo no puede superar los 8 MB.');
    logoInput.reportValidity();
    setFormStatus('El logotipo no puede superar los 8 MB.', true);
    return false;
  }

  logoInput.setCustomValidity('');
  return true;
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
    setFormStatus(successMessage, false);
    submissionPanel.hidden = false;
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
    formStatus.classList.remove('is-error', 'is-success');
    return;
  }

  formStatus.hidden = false;
  formStatus.textContent = message;
  formStatus.classList.toggle('is-error', Boolean(isError));
  formStatus.classList.toggle('is-success', !isError);
}
