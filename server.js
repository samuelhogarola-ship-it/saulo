const express = require('express');
const multer = require('multer');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ quiet: true });

const app = express();
const port = Number(process.env.PORT || 4173);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});

const publicDir = __dirname;
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_STORAGE_BUCKET',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'RESEND_TO_EMAIL',
];

app.use(express.static(publicDir, { extensions: ['html'] }));

app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.post(
  '/api/questionnaire',
  upload.single('logoFile'),
  async (req, res, next) => {
    try {
      const submission = normalizeSubmission(req.body, req.file);

      if (!submission.answers.appProjectName) {
        return res.status(400).json({
          ok: false,
          message: 'El nombre del proyecto app es obligatorio.',
        });
      }

      if (!submission.answers.accessSystem) {
        return res.status(400).json({
          ok: false,
          message: 'Selecciona un sistema de acceso para los alumnos.',
        });
      }

      const missingEnvVars = requiredEnvVars.filter(
        (key) => !process.env[key] || !String(process.env[key]).trim(),
      );

      if (missingEnvVars.length > 0) {
        if (process.env.ALLOW_DEMO_SUBMISSIONS === 'true') {
          return res.json({
            ok: true,
            mode: 'demo',
            message: 'Formulario recibido en modo demo.',
          });
        }

        return res.status(500).json({
          ok: false,
          message:
            'Faltan variables de entorno para Supabase/Resend. Revisa la configuración del servidor.',
          missingEnvVars,
        });
      }

      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        },
      );

      const resend = new Resend(process.env.RESEND_API_KEY);
      const submissionId = randomUUID();

      const uploadedLogo = req.file
        ? await uploadLogoToSupabase({
            supabase,
            submissionId,
            file: req.file,
            bucket: process.env.SUPABASE_STORAGE_BUCKET,
          })
        : null;

      const insertPayload = {
        id: submissionId,
        submitted_at: submission.submittedAt,
        app_project_name: submission.answers.appProjectName,
        access_system: submission.answers.accessSystem,
        student_volume: submission.answers.studentVolume,
        video_management: submission.answers.videoManagement,
        photo_frequency: submission.answers.photoFrequency,
        technique_videos: submission.answers.techniqueVideos,
        main_communication: submission.answers.mainCommunication,
        ai_assistant: submission.answers.aiAssistant,
        payments: submission.answers.payments,
        renewal_system: submission.answers.renewalSystem,
        meeting_date: submission.answers.meetingDate,
        meeting_time: submission.answers.meetingTime,
        extra_notes: submission.answers.extraNotes,
        custom_requests: submission.answers.customRequests,
        routine_variables: submission.answers.routineVariables,
        logo_file_name: uploadedLogo?.originalName || null,
        logo_storage_path: uploadedLogo?.storagePath || null,
        logo_public_url: uploadedLogo?.publicUrl || null,
        payload: {
          ...submission,
          answers: {
            ...submission.answers,
            logoFile: uploadedLogo
              ? {
                  name: uploadedLogo.originalName,
                  type: uploadedLogo.contentType,
                  size: uploadedLogo.size,
                  storagePath: uploadedLogo.storagePath,
                  publicUrl: uploadedLogo.publicUrl,
                }
              : null,
          },
        },
      };

      const { error: insertError } = await supabase
        .from('questionnaire_submissions')
        .insert(insertPayload);

      if (insertError) {
        throw insertError;
      }

      const emailPayload = {
        from: process.env.RESEND_FROM_EMAIL,
        to: [process.env.RESEND_TO_EMAIL],
        subject: `Nuevo cuestionario de ${submission.answers.appProjectName}`,
        html: renderSubmissionEmail(insertPayload.payload),
      };

      if (req.file) {
        emailPayload.attachments = [
          {
            content: req.file.buffer.toString('base64'),
            filename: req.file.originalname,
          },
        ];
      }

      const { error: emailError } = await resend.emails.send(emailPayload);

      if (emailError) {
        throw emailError;
      }

      return res.json({ ok: true, submissionId });
    } catch (error) {
      return next(error);
    }
  },
);

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      ok: false,
      message: 'El archivo del logotipo supera el tamaño máximo permitido.',
    });
  }

  console.error(error);

  return res.status(500).json({
    ok: false,
    message:
      'No hemos podido enviar el cuestionario. Revisa la configuración o inténtalo de nuevo.',
  });
});

app.listen(port, () => {
  console.log(`Saulo app listening on http://127.0.0.1:${port}`);
});

function normalizeSubmission(body, file) {
  return {
    submittedAt: new Date().toISOString(),
    landing: 'saulo-temporal',
    integrationTarget: {
      database: 'supabase',
      email: 'resend',
    },
    answers: {
      appProjectName: normalizeString(body.brandName),
      logoFile: file
        ? {
            name: file.originalname,
            size: file.size,
            type: file.mimetype,
          }
        : null,
      accessSystem: normalizeString(body.accessSystem),
      studentVolume: normalizeString(body.studentVolume),
      videoManagement: normalizeString(body.videoManagement),
      routineVariables: normalizeMultiValue(body.routineVariables),
      photoFrequency: normalizeString(body.photoFrequency),
      techniqueVideos: normalizeString(body.techniqueVideos),
      mainCommunication: normalizeString(body.mainCommunication),
      aiAssistant: normalizeString(body.aiAssistant),
      payments: normalizeString(body.payments),
      renewalSystem: normalizeString(body.renewalSystem),
      meetingDate: normalizeString(body.meetingDate),
      meetingTime: normalizeString(body.meetingTime),
      extraNotes: normalizeString(body.extraNotes),
      customRequests: normalizeString(body.customRequests),
    },
  };
}

async function uploadLogoToSupabase({ supabase, submissionId, file, bucket }) {
  const extension = path.extname(file.originalname || '').toLowerCase();
  const safeBaseName = sanitizeForPath(
    path.basename(file.originalname || 'logo', extension),
  );
  const storagePath = `questionnaires/${submissionId}/${safeBaseName || 'logo'}${
    extension || ''
  }`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(storagePath);

  return {
    originalName: file.originalname,
    contentType: file.mimetype,
    size: file.size,
    storagePath,
    publicUrl,
  };
}

function renderSubmissionEmail(submission) {
  const answers = submission.answers;
  const rows = [
    ['Proyecto app', answers.appProjectName],
    ['Acceso alumnos', answers.accessSystem],
    ['Volumen previsto', answers.studentVolume],
    ['Vídeos de ejercicios', answers.videoManagement],
    ['Variables de rutina', formatList(answers.routineVariables)],
    ['Frecuencia de fotos', answers.photoFrequency],
    ['Vídeos para corrección', answers.techniqueVideos],
    ['Canal principal', answers.mainCommunication],
    ['IA asistente', answers.aiAssistant],
    ['Pagos', answers.payments],
    ['Renovaciones', answers.renewalSystem],
    ['Fecha reunión', answers.meetingDate],
    ['Hora reunión', answers.meetingTime],
    ['Notas adicionales', answers.extraNotes],
    ['Comentarios extra', answers.customRequests],
    ['URL logo', answers.logoFile?.publicUrl || null],
  ];

  const renderedRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding: 10px 12px; border: 1px solid #e5d9ff; font-weight: 700;">${escapeHtml(label)}</td>
          <td style="padding: 10px 12px; border: 1px solid #e5d9ff;">${escapeHtml(value || 'Sin respuesta')}</td>
        </tr>
      `,
    )
    .join('');

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #1b1326;">
      <h1 style="margin-bottom: 8px;">Nuevo cuestionario Saulo</h1>
      <p style="margin-top: 0; color: #5c4c75;">Enviado el ${escapeHtml(submission.submittedAt)}</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 24px;">
        <tbody>${renderedRows}</tbody>
      </table>
    </div>
  `;
}

function normalizeString(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeMultiValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function sanitizeForPath(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatList(value) {
  return Array.isArray(value) && value.length > 0 ? value.join(', ') : null;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
