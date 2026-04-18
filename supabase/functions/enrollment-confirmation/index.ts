// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

type StudentSummary = {
  id?: string;
  first_name?: string;
  last_name?: string;
  vietnamese_name?: string | null;
  courses?: string[];
};

type ClassSelectionSummary = {
  student_id?: string;
  giao_ly_level?: number | null;
  giao_ly_class_name?: string | null;
  viet_ngu_level?: number | null;
  viet_ngu_class_name?: string | null;
  giao_ly_completed?: boolean;
  viet_ngu_completed?: boolean;
};

type EnrollmentConfirmationPayload = {
  to_emails?: string[];
  family_name?: string | null;
  academic_year_name?: string;
  students?: StudentSummary[];
  class_selections?: ClassSelectionSummary[];
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-enrollment-function-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function buildEmailHtml(payload: EnrollmentConfirmationPayload): string {
  const familyName = payload.family_name || 'Your Family';
  const yearName = payload.academic_year_name || 'the current academic year';
  const students = payload.students || [];
  const studentsWithCourses = students
    .map((student) => {
      const courses = Array.from(
        new Set((student.courses || []).filter((course): course is string => !!course)),
      );
      return {
        student,
        courses,
      };
    })
    .filter(({ courses }) => courses.length > 0);

  const studentLines =
    studentsWithCourses.length > 0
      ? studentsWithCourses
          .map(({ student, courses }) => {
            const fullName = [student.first_name, student.last_name]
              .filter(Boolean)
              .join(' ')
              .trim();
            const vnName = student.vietnamese_name
              ? ` (${student.vietnamese_name})`
              : '';
            const courseLines = courses
              .map(
                (course) =>
                  `<li style="margin: 0 0 4px; padding: 0;">${course}</li>`,
              )
              .join('');
            return `
              <li style="margin: 0 0 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <p style="margin: 0 0 8px;">
                  <strong>${fullName || 'Student'}${vnName}</strong>
                </p>
                <p style="margin: 0 0 6px; color: #374151; font-size: 13px;">Enrolled courses:</p>
                <ul style="margin: 0; padding-left: 20px;">${courseLines}</ul>
              </li>
            `;
          })
          .join('')
      : '<li style="margin: 0;">No class enrollments were submitted.</li>';

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2 style="margin: 0 0 12px; color: #065f46;">Enrollment Confirmation</h2>
      <p>Thank you for submitting your enrollment for <strong>${familyName}</strong>.</p>
      <p>We have received your registration for <strong>${yearName}</strong>.</p>
      <p style="margin: 0 0 8px;">Registered courses by student:</p>
      <ul style="margin: 0; padding-left: 0; list-style: none;">${studentLines}</ul>
      <p>
        If you need to make updates, please contact the parish office.
      </p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
      <p style="margin: 0; font-size: 13px; color: #6b7280;">
        This is an automated confirmation from GXKTM enrollment.
      </p>
    </div>
  `;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const configuredSecret = Deno.env.get('ENROLLMENT_CONFIRMATION_FUNCTION_SECRET') || '';
  const providedSecret = req.headers.get('x-enrollment-function-secret') || '';
  if (configuredSecret && providedSecret !== configuredSecret) {
    return jsonResponse(401, { error: 'Unauthorized' });
  }

  let payload: EnrollmentConfirmationPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON payload' });
  }

  const toEmails = (payload.to_emails || []).filter((email) => !!email);
  if (toEmails.length === 0) {
    return jsonResponse(400, { error: 'No recipients provided' });
  }

  const brevoApiKey = Deno.env.get('BREVO_API_KEY') || '';
  if (!brevoApiKey) {
    return jsonResponse(500, { error: 'BREVO_API_KEY is not configured' });
  }

  const fromName = Deno.env.get('ENROLLMENT_FROM_NAME') || 'GXKTM Enrollment';
  const fromEmail = Deno.env.get('ENROLLMENT_FROM_EMAIL') || 'noreply@gxktm.org';
  const replyToEmail = Deno.env.get('ENROLLMENT_REPLY_TO') || undefined;

  const emailBody = {
    sender: {
      name: fromName,
      email: fromEmail,
    },
    to: toEmails.map((email) => ({ email })),
    subject: `Enrollment Confirmation - ${payload.academic_year_name || 'School Year'}`,
    htmlContent: buildEmailHtml(payload),
    replyTo: replyToEmail ? { email: replyToEmail } : undefined,
  };

  const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': brevoApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailBody),
  });

  if (!brevoResponse.ok) {
    const brevoErrorText = await brevoResponse.text();
    return jsonResponse(502, {
      error: 'Failed to send email via Brevo',
      details: brevoErrorText,
    });
  }

  return jsonResponse(200, { success: true });
});
