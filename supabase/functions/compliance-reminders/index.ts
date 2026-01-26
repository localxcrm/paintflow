import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Reminder windows in days before expiration
const REMINDER_WINDOWS = [30, 14, 7, 0];

// Get environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const APP_URL = Deno.env.get('APP_URL') || 'https://paintflow.vercel.app';

// Email template function
function generateEmailHTML(params: {
  subcontractorName: string;
  documentType: 'Licenca' | 'Seguro';
  expirationDate: string;
  daysUntilExpiration: number;
  actionUrl: string;
}): string {
  const { subcontractorName, documentType, expirationDate, daysUntilExpiration, actionUrl } = params;

  const isExpired = daysUntilExpiration <= 0;
  const isUrgent = daysUntilExpiration > 0 && daysUntilExpiration <= 7;
  const isWarning = daysUntilExpiration > 7 && daysUntilExpiration <= 30;

  const documentName = documentType === 'Licenca' ? 'Licença' : 'Seguro';

  // Determine colors based on urgency
  const bgColor = isExpired ? '#FEE2E2' : isUrgent ? '#FED7AA' : '#FEF3C7';
  const borderColor = isExpired ? '#DC2626' : isUrgent ? '#EA580C' : '#D97706';

  let warningMessage = '';
  if (isExpired) {
    warningMessage = `<strong>ATENÇÃO:</strong> Documentos vencidos podem resultar em suspensão de trabalhos. Por favor, atualize imediatamente.`;
  } else if (isUrgent) {
    warningMessage = `<strong>URGENTE:</strong> Seu documento vence em breve. Atualize o mais rápido possível para evitar interrupções.`;
  } else if (isWarning) {
    warningMessage = `<strong>IMPORTANTE:</strong> Mantenha sua documentação atualizada para continuar recebendo trabalhos.`;
  }

  let messageText = '';
  if (isExpired) {
    messageText = `Seu <strong>${documentName}</strong> venceu em <strong>${expirationDate}</strong>.`;
  } else {
    messageText = `Seu <strong>${documentName}</strong> vence em <strong>${daysUntilExpiration} dia(s)</strong> (${expirationDate}).`;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F3F4F6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 8px; padding: 40px 20px;">
          <!-- Header with warning icon -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <div style="font-size: 48px; margin: 0; line-height: 1;">⚠️</div>
              <h1 style="color: #1F2937; font-size: 24px; font-weight: bold; margin: 16px 0 0 0;">
                ${isExpired ? 'Documento Vencido' : 'Lembrete de Vencimento'}
              </h1>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="color: #374151; font-size: 16px; line-height: 24px; padding: 16px 0;">
              Olá ${subcontractorName},
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="color: #374151; font-size: 16px; line-height: 24px; padding: 16px 0;">
              ${messageText}
            </td>
          </tr>

          <!-- Warning box -->
          <tr>
            <td style="padding: 24px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${bgColor}; border-radius: 6px; border-left: 4px solid ${borderColor};">
                <tr>
                  <td style="padding: 16px;">
                    <p style="color: #1F2937; font-size: 14px; line-height: 20px; margin: 0;">
                      ${warningMessage}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Action button -->
          <tr>
            <td align="center" style="padding: 32px 0;">
              <a href="${actionUrl}" style="background-color: #2563EB; border-radius: 6px; color: #FFFFFF; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 12px 32px;">
                Atualizar ${documentName}
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="color: #6B7280; font-size: 14px; line-height: 20px; padding: 8px 0;">
              Este é um lembrete automático. Você receberá notificações 30 dias, 7 dias e no dia do vencimento.
            </td>
          </tr>
          <tr>
            <td align="center" style="color: #6B7280; font-size: 14px; line-height: 20px; padding: 8px 0;">
              Se você já atualizou seu ${documentName.toLowerCase()}, desconsidere este email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Send email via Resend
async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  idempotencyKey: string;
}): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': params.idempotencyKey,
      },
      body: JSON.stringify({
        from: 'PaintFlow <noreply@paintflow.com>',
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// Main handler
Deno.serve(async (req: Request) => {
  try {
    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    let remindersProcessed = 0;

    // Query all subcontractors with compliance dates
    const { data: subcontractors, error: queryError } = await supabase
      .from('Subcontractor')
      .select('id, name, email, organizationId, licenseExpirationDate, insuranceExpirationDate, lastLicenseReminderSentAt, lastInsuranceReminderSentAt')
      .or('licenseExpirationDate.not.is.null,insuranceExpirationDate.not.is.null');

    if (queryError) {
      console.error('Query error:', queryError);
      return new Response(
        JSON.stringify({ error: 'Failed to query subcontractors' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!subcontractors || subcontractors.length === 0) {
      return new Response(
        JSON.stringify({ success: true, remindersProcessed: 0, message: 'No subcontractors with compliance dates' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Process each subcontractor
    for (const sub of subcontractors) {
      const reminders: Array<{ type: 'license' | 'insurance', days: number, date: string }> = [];

      // Check license expiration
      if (sub.licenseExpirationDate) {
        const expirationDate = new Date(sub.licenseExpirationDate);
        const todayDate = new Date(today);
        const daysUntilExpiration = Math.floor((expirationDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

        // Check if we should send reminder
        const shouldSend =
          REMINDER_WINDOWS.includes(daysUntilExpiration) || // Matches reminder window
          daysUntilExpiration < 0; // Expired

        // Check if we already sent today
        const lastSent = sub.lastLicenseReminderSentAt ? new Date(sub.lastLicenseReminderSentAt).toISOString().split('T')[0] : null;
        const alreadySentToday = lastSent === today;

        if (shouldSend && !alreadySentToday) {
          reminders.push({ type: 'license', days: daysUntilExpiration, date: sub.licenseExpirationDate });
        }
      }

      // Check insurance expiration
      if (sub.insuranceExpirationDate) {
        const expirationDate = new Date(sub.insuranceExpirationDate);
        const todayDate = new Date(today);
        const daysUntilExpiration = Math.floor((expirationDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

        // Check if we should send reminder
        const shouldSend =
          REMINDER_WINDOWS.includes(daysUntilExpiration) || // Matches reminder window
          daysUntilExpiration < 0; // Expired

        // Check if we already sent today
        const lastSent = sub.lastInsuranceReminderSentAt ? new Date(sub.lastInsuranceReminderSentAt).toISOString().split('T')[0] : null;
        const alreadySentToday = lastSent === today;

        if (shouldSend && !alreadySentToday) {
          reminders.push({ type: 'insurance', days: daysUntilExpiration, date: sub.insuranceExpirationDate });
        }
      }

      // Send reminders for this subcontractor
      for (const reminder of reminders) {
        const documentType = reminder.type === 'license' ? 'Licenca' : 'Seguro';
        const documentName = reminder.type === 'license' ? 'Licença' : 'Seguro';
        const notificationType = reminder.type === 'license' ? 'compliance_license' : 'compliance_insurance';

        // Format date as DD/MM/YYYY
        const dateParts = reminder.date.split('-');
        const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

        // Generate idempotency key
        const idempotencyKey = `${sub.id}-${reminder.type}-${today}`;

        // Generate email subject
        const isExpired = reminder.days < 0;
        const subject = isExpired
          ? `URGENTE: Seu ${documentName} venceu`
          : `Lembrete: Seu ${documentName} vence em ${reminder.days} dias`;

        // Generate email HTML
        const html = generateEmailHTML({
          subcontractorName: sub.name,
          documentType,
          expirationDate: formattedDate,
          daysUntilExpiration: reminder.days,
          actionUrl: `${APP_URL}/sub/perfil#compliance`,
        });

        // Send email
        const emailSent = await sendEmail({
          to: sub.email,
          subject,
          html,
          idempotencyKey,
        });

        if (emailSent) {
          // Create notification for sub
          await supabase.from('Notification').insert({
            userId: sub.id,
            userType: 'sub',
            organizationId: sub.organizationId,
            type: notificationType,
            title: subject,
            message: isExpired
              ? `Seu ${documentName.toLowerCase()} venceu em ${formattedDate}. Atualize imediatamente para continuar recebendo trabalhos.`
              : `Seu ${documentName.toLowerCase()} vence em ${reminder.days} dia(s) (${formattedDate}). Mantenha sua documentação atualizada.`,
            data: {
              subcontractorId: sub.id,
              subcontractorName: sub.name,
              documentType: reminder.type,
              expirationDate: reminder.date,
              daysUntilExpiration: reminder.days,
            },
            isRead: false,
          });

          // Create notification for admins in the same organization
          // Query users in the organization
          const { data: orgUsers } = await supabase
            .from('UserOrganization')
            .select('userId')
            .eq('organizationId', sub.organizationId);

          if (orgUsers && orgUsers.length > 0) {
            for (const orgUser of orgUsers) {
              await supabase.from('Notification').insert({
                userId: orgUser.userId,
                userType: 'admin',
                organizationId: sub.organizationId,
                type: notificationType,
                title: `${sub.name}: ${subject}`,
                message: isExpired
                  ? `O ${documentName.toLowerCase()} de ${sub.name} venceu em ${formattedDate}.`
                  : `O ${documentName.toLowerCase()} de ${sub.name} vence em ${reminder.days} dia(s) (${formattedDate}).`,
                data: {
                  subcontractorId: sub.id,
                  subcontractorName: sub.name,
                  documentType: reminder.type,
                  expirationDate: reminder.date,
                  daysUntilExpiration: reminder.days,
                },
                isRead: false,
              });
            }
          }

          // Update lastReminderSentAt timestamp
          const updateField = reminder.type === 'license' ? 'lastLicenseReminderSentAt' : 'lastInsuranceReminderSentAt';
          await supabase
            .from('Subcontractor')
            .update({ [updateField]: new Date().toISOString() })
            .eq('id', sub.id);

          remindersProcessed++;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, remindersProcessed }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
