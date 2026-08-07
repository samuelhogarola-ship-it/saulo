const pageData = readPageData();
const globalStatus = document.querySelector('#admin-global-status');

document
  .querySelector('#admin-event-create-form')
  ?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      await sendJson('/api/admin/events', 'POST', payload);
      setGlobalStatus('Evento creado correctamente.', 'success');
      window.location.reload();
    } catch (error) {
      setGlobalStatus(error.message, 'error');
    }
  });

document
  .querySelector('#admin-event-edit-form')
  ?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const eventId = form.dataset.eventId;
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      await sendJson(`/api/admin/events/${eventId}`, 'PATCH', payload);
      setGlobalStatus('Evento actualizado.', 'success');
      window.location.reload();
    } catch (error) {
      setGlobalStatus(error.message, 'error');
    }
  });

document
  .querySelector('#admin-event-poster-form')
  ?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const eventId = form.dataset.eventId;
    const input = form.querySelector('input[type="file"]');
    const file = input?.files?.[0];

    if (!file) {
      setGlobalStatus('Selecciona una imagen antes de subirla.', 'error');
      return;
    }

    const base64Data = await readFileAsBase64(file);

    try {
      await sendJson(`/api/admin/events/${eventId}/poster`, 'POST', {
        filename: file.name,
        contentType: file.type || 'image/png',
        base64Data,
      });
      setGlobalStatus('Cartel actualizado.', 'success');
      window.location.reload();
    } catch (error) {
      setGlobalStatus(error.message, 'error');
    }
  });

document
  .querySelector('#admin-manual-registration-form')
  ?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const eventId = form.dataset.eventId;
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      await sendJson(
        `/api/admin/events/${eventId}/registrations`,
        'POST',
        payload,
      );
      setGlobalStatus('Inscrito añadido.', 'success');
      window.location.reload();
    } catch (error) {
      setGlobalStatus(error.message, 'error');
    }
  });

document.addEventListener('click', async (event) => {
  const setStatusButton = event.target.closest('[data-registration-status]');
  if (setStatusButton) {
    const row = setStatusButton.closest('[data-registration-form]');
    if (!row) {
      return;
    }

    row.querySelector('select[name="payment_status"]').value =
      setStatusButton.dataset.registrationStatus;
    await saveRegistrationRow(row);
    return;
  }

  const deleteButton = event.target.closest('[data-registration-delete]');
  if (deleteButton) {
    const row = deleteButton.closest('[data-registration-form]');
    if (!row) {
      return;
    }

    if (!window.confirm('¿Eliminar esta inscripción?')) {
      return;
    }

    try {
      await sendJson(
        `/api/admin/registrations/${row.dataset.registrationId}`,
        'DELETE',
      );
      window.location.reload();
    } catch (error) {
      setGlobalStatus(error.message, 'error');
    }
  }
});

document.querySelectorAll('[data-registration-form]').forEach((form) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await saveRegistrationRow(event.currentTarget);
  });
});

async function saveRegistrationRow(form) {
  const registrationId = form.dataset.registrationId;
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    await sendJson(
      `/api/admin/registrations/${registrationId}`,
      'PATCH',
      payload,
    );
    setGlobalStatus('Inscripción actualizada.', 'success');
    window.location.reload();
  } catch (error) {
    setGlobalStatus(error.message, 'error');
  }
}

async function sendJson(url, method, payload) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || 'No se pudo completar la operación.');
  }

  return result;
}

function setGlobalStatus(message, tone) {
  if (!globalStatus) {
    return;
  }

  globalStatus.textContent = message || '';
  globalStatus.dataset.tone = tone || '';
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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

void pageData;
