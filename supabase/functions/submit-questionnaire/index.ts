import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const requiredEnvVars = [
  'SERVICE_ROLE_KEY',
  'STORAGE_BUCKET',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'RESEND_TO_EMAIL',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, message: 'Method not allowed' }, 405);
  }

  const missingEnvVars = requiredEnvVars.filter((key) => !Deno.env.get(key));

  if (missingEnvVars.length > 0) {
    return jsonResponse(
      {
        ok: false,
        message: 'Missing environment variables in Supabase Edge Function.',
        missingEnvVars,
      },
      500,
    );
  }

  try {
    const formData = await req.formData();
    const parsed = normalizeSubmission(formData);

    if (!parsed.answers.appProjectName) {
      return jsonResponse(
        {
          ok: false,
          message: 'El nombre del proyecto app es obligatorio.',
        },
        400,
      );
    }

    if (!parsed.answers.accessSystem) {
      return jsonResponse(
        {
          ok: false,
          message: 'Selecciona un sistema de acceso para los alumnos.',
        },
        400,
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const submissionId = crypto.randomUUID();
    const bucket = Deno.env.get('STORAGE_BUCKET')!;

    const logo = await maybeUploadLogo({
      supabase,
      bucket,
      submissionId,
      file: parsed.logoFile,
    });

    const insertPayload = {
      id: submissionId,
      submitted_at: parsed.submittedAt,
      app_project_name: parsed.answers.appProjectName,
      access_system: parsed.answers.accessSystem,
      student_volume: parsed.answers.studentVolume,
      video_management: parsed.answers.videoManagement,
      photo_frequency: parsed.answers.photoFrequency,
      technique_videos: parsed.answers.techniqueVideos,
      main_communication: parsed.answers.mainCommunication,
      ai_assistant: parsed.answers.aiAssistant,
      payments: parsed.answers.payments,
      renewal_system: parsed.answers.renewalSystem,
      meeting_date: parsed.answers.meetingDate,
      meeting_time: parsed.answers.meetingTime,
      extra_notes: parsed.answers.extraNotes,
      custom_requests: parsed.answers.customRequests,
      routine_variables: parsed.answers.routineVariables,
      logo_file_name: logo?.originalName ?? null,
      logo_storage_path: logo?.storagePath ?? null,
      logo_public_url: logo?.publicUrl ?? null,
      payload: {
        ...parsed,
        answers: {
          ...parsed.answers,
          logoFile: logo
            ? {
                name: logo.originalName,
                type: logo.contentType,
                size: logo.size,
                storagePath: logo.storagePath,
                publicUrl: logo.publicUrl,
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

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: Deno.env.get('RESEND_FROM_EMAIL')!,
        to: [Deno.env.get('RESEND_TO_EMAIL')!],
        subject: `Nuevo cuestionario de ${parsed.answers.appProjectName}`,
        html: renderSubmissionEmail(insertPayload.payload),
        attachments: parsed.logoFile
          ? [
              {
                filename: parsed.logoFile.name,
                content: await fileToBase64(parsed.logoFile),
              },
            ]
          : undefined,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      throw new Error(`Resend error: ${resendError}`);
    }

    return jsonResponse({ ok: true, submissionId }, 200);
  } catch (error) {
    console.error(error);
    return jsonResponse(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : 'No hemos podido enviar el cuestionario.',
      },
      500,
    );
  }
});

function normalizeSubmission(formData: FormData) {
  return {
    submittedAt: new Date().toISOString(),
    landing: 'saulo-temporal',
    integrationTarget: {
      database: 'supabase',
      email: 'resend',
    },
    logoFile: getFile(formData, 'logoFile'),
    answers: {
      appProjectName: normalizeString(formData.get('brandName')),
      accessSystem: normalizeString(formData.get('accessSystem')),
      studentVolume: normalizeString(formData.get('studentVolume')),
      videoManagement: normalizeString(formData.get('videoManagement')),
      routineVariables: normalizeArray(formData.getAll('routineVariables')),
      photoFrequency: normalizeString(formData.get('photoFrequency')),
      techniqueVideos: normalizeString(formData.get('techniqueVideos')),
      mainCommunication: normalizeString(formData.get('mainCommunication')),
      aiAssistant: normalizeString(formData.get('aiAssistant')),
      payments: normalizeString(formData.get('payments')),
      renewalSystem: normalizeString(formData.get('renewalSystem')),
      meetingDate: normalizeString(formData.get('meetingDate')),
      meetingTime: normalizeString(formData.get('meetingTime')),
      extraNotes: normalizeString(formData.get('extraNotes')),
      customRequests: normalizeString(formData.get('customRequests')),
    },
  };
}

function getFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);
  return value instanceof File && value.name ? value : null;
}

async function maybeUploadLogo({
  supabase,
  bucket,
  submissionId,
  file,
}: {
  supabase: ReturnType<typeof createClient>;
  bucket: string;
  submissionId: string;
  file: File | null;
}) {
  if (!file) {
    return null;
  }

  const extension = file.name.includes('.')
    ? `.${file.name.split('.').pop()!.toLowerCase()}`
    : '';
  const baseName = sanitizeForPath(file.name.replace(/\.[^.]+$/, '')) || 'logo';
  const storagePath = `questionnaires/${submissionId}/${baseName}${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(storagePath);

  return {
    originalName: file.name,
    contentType: file.type,
    size: file.size,
    storagePath,
    publicUrl,
  };
}

function normalizeString(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeArray(values: FormDataEntryValue[]) {
  return values
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean);
}

function sanitizeForPath(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function renderSubmissionEmail(submission: any) {
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

function formatList(value: string[] | null | undefined) {
  return Array.isArray(value) && value.length > 0 ? value.join(', ') : null;
}

function escapeHtml(value: string) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

function jsonResponse(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}
