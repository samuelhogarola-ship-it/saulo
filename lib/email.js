const { resendApiKey, resendFromEmail, resendToEmail } = require('./config');
const { formatCurrency, formatDateDayMonth, formatTime } = require('./utils');

async function sendRegistrationEmails({ event, registration }) {
  if (!resendApiKey || /xxxxxxxxx|^re_example/i.test(resendApiKey)) {
    return {
      organizer: 'skipped',
      user: registration.email ? 'skipped' : 'not-requested',
    };
  }

  const organizerPayload = {
    from: resendFromEmail,
    to: [event.organizer_email || resendToEmail],
    subject: `Nueva inscripción en ${event.title}`,
    html: `
      <h1>Nueva inscripción en ${event.title}</h1>
      <p><strong>Nombre:</strong> ${registration.full_name}</p>
      <p><strong>Email:</strong> ${registration.email || 'No informado'}</p>
      <p><strong>Teléfono:</strong> ${registration.phone}</p>
      <p><strong>Evento:</strong> ${event.title}</p>
      <p><strong>Fecha de inscripción:</strong> ${new Date(registration.registered_at).toLocaleString('es-ES')}</p>
    `,
  };

  const results = {
    organizer: await sendEmail(organizerPayload),
    user: 'not-requested',
  };

  if (registration.email) {
    results.user = await sendEmail({
      from: resendFromEmail,
      to: [registration.email],
      subject: `Confirmación de inscripción - ${event.title}`,
      html: `
        <h1>Tu inscripción ha sido recibida</h1>
        <p><strong>Evento:</strong> ${event.title}</p>
        <p><strong>Fecha:</strong> ${formatDateDayMonth(event.event_date)}</p>
        <p><strong>Hora:</strong> ${formatTime(event.event_time)}</p>
        <p><strong>Lugar:</strong> ${event.location}</p>
        <p><strong>Precio:</strong> ${formatCurrency(event.price)}</p>
        <p>Tu inscripción ha sido recibida. El organizador confirmará el pago por la vía acordada.</p>
      `,
    });
  }

  return results;
}

async function sendEmail(payload) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend error: ${response.status} ${errorText}`);
  }

  return 'sent';
}

module.exports = {
  sendRegistrationEmails,
};
