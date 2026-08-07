const pageData = readPageData();
const form = document.querySelector('#event-registration-form');
const statusBox = document.querySelector('#event-form-status');

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  clearErrors();
  setStatus('Enviando tu inscripción...', 'info');

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  const errors = validate(payload);

  if (Object.keys(errors).length) {
    paintErrors(errors);
    setStatus('Revisa los campos marcados antes de continuar.', 'error');
    return;
  }

  try {
    const response = await fetch(`/api/events/${pageData.slug}/registrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'No se pudo completar la inscripción.');
    }

    form.reset();
    setStatus(
      'Tu inscripción ha sido recibida. El organizador confirmará el pago por la vía acordada.',
      'success',
    );
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

function validate(payload) {
  const errors = {};

  if (!String(payload.full_name || '').trim()) {
    errors.full_name = 'El nombre completo es obligatorio.';
  }

  if (!String(payload.phone || '').trim()) {
    errors.phone = 'El teléfono es obligatorio.';
  }

  if (
    payload.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.email).trim())
  ) {
    errors.email = 'Introduce un email válido.';
  }

  return errors;
}

function paintErrors(errors) {
  Object.entries(errors).forEach(([field, message]) => {
    const target = document.querySelector(`[data-error-for="${field}"]`);
    if (target) {
      target.textContent = message;
    }
  });
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach((node) => {
    node.textContent = '';
  });
}

function setStatus(message, tone) {
  if (!statusBox) {
    return;
  }

  statusBox.textContent = message || '';
  statusBox.dataset.tone = tone || '';
}

function readPageData() {
  const source = document.querySelector('#saulo-page-data');
  if (!source) {
    return {};
  }

  try {
    return JSON.parse(source.textContent || '{}');
  } catch (_error) {
    return {};
  }
}
