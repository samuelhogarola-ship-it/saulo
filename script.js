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

let currentStep = 0;

function updateStep() {
  steps.forEach((step, index) => {
    step.classList.toggle('is-active', index === currentStep);
  });

  const stepNumber = currentStep + 1;
  const totalSteps = steps.length;
  const progress = (stepNumber / totalSteps) * 100;

  progressBar.style.width = `${progress}%`;
  progressText.textContent = `Paso ${stepNumber} de ${totalSteps}`;
  prevButton.disabled = currentStep === 0;
  nextButton.classList.toggle('is-hidden', currentStep === totalSteps - 1);
  submitButton.classList.toggle('is-hidden', currentStep !== totalSteps - 1);

  if (stepsWindow) {
    stepsWindow.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function getFieldValue(name) {
  const field = form.elements[name];

  if (!field) {
    return null;
  }

  if (field instanceof RadioNodeList) {
    const values = [...field];
    const isCheckboxGroup = values.some((item) => item.type === 'checkbox');

    if (isCheckboxGroup) {
      return values.filter((item) => item.checked).map((item) => item.value);
    }

    const selected = values.find((item) => item.checked);
    return selected ? selected.value : null;
  }

  if (field.type === 'file') {
    return field.files[0]
      ? {
          name: field.files[0].name,
          size: field.files[0].size,
          type: field.files[0].type,
        }
      : null;
  }

  return field.value || null;
}

function buildPayload() {
  return {
    submittedAt: new Date().toISOString(),
    landing: 'saulo-temporal',
    integrationTarget: {
      database: 'supabase',
      email: 'resend',
    },
    answers: {
      brandName: getFieldValue('brandName'),
      logoFile: getFieldValue('logoFile'),
      accessSystem: getFieldValue('accessSystem'),
      studentVolume: getFieldValue('studentVolume'),
      videoManagement: getFieldValue('videoManagement'),
      routineVariables: getFieldValue('routineVariables'),
      photoFrequency: getFieldValue('photoFrequency'),
      techniqueVideos: getFieldValue('techniqueVideos'),
      mainCommunication: getFieldValue('mainCommunication'),
      aiAssistant: getFieldValue('aiAssistant'),
      payments: getFieldValue('payments'),
      renewalSystem: getFieldValue('renewalSystem'),
      meetingDate: getFieldValue('meetingDate'),
      meetingTime: getFieldValue('meetingTime'),
      extraNotes: getFieldValue('extraNotes'),
      customRequests: getFieldValue('customRequests'),
    },
  };
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

  buildPayload();
  form.hidden = true;
  formTopbar.hidden = true;
  progressTrack.hidden = true;
  submissionPanel.hidden = false;
  submissionPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

updateStep();
