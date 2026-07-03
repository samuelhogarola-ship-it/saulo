(function () {
  const registrationForm = document.querySelector(
    '[data-event-registration-form]',
  );
  const formStatus = document.querySelector('[data-form-status]');
  const eventsPageLanguage =
    document.documentElement.lang === 'pt-BR' ? 'pt-br' : 'es';

  if (!registrationForm || !formStatus) {
    return;
  }

  registrationForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    formStatus.textContent =
      eventsPageLanguage === 'pt-br'
        ? 'Enviando solicitação...'
        : 'Enviando solicitud...';

    const slug = registrationForm.dataset.eventSlug;
    const formData = new FormData(registrationForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`/api/public/events/${slug}/registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.message ||
            (eventsPageLanguage === 'pt-br'
              ? 'Não foi possível registrar a solicitação.'
              : 'No se pudo registrar la solicitud.'),
        );
      }

      registrationForm.reset();
      formStatus.textContent =
        result.message ||
        (eventsPageLanguage === 'pt-br'
          ? 'Solicitação recebida. Entraremos em contato para confirmar sua vaga.'
          : 'Solicitud recibida. Te contactaremos para confirmar tu plaza.');
    } catch (error) {
      formStatus.textContent =
        error.message ||
        (eventsPageLanguage === 'pt-br'
          ? 'Não foi possível enviar a solicitação do evento.'
          : 'No se pudo enviar la solicitud del evento.');
    }
  });
})();
