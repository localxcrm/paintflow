import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
} from '@react-email/components';

interface ComplianceReminderEmailProps {
  subcontractorName: string;
  documentType: 'Licenca' | 'Seguro';
  expirationDate: string;  // Format: DD/MM/YYYY
  daysUntilExpiration: number;
  actionUrl: string;
}

export function ComplianceReminderEmail({
  subcontractorName,
  documentType,
  expirationDate,
  daysUntilExpiration,
  actionUrl,
}: ComplianceReminderEmailProps) {
  const isExpired = daysUntilExpiration <= 0;
  const isUrgent = daysUntilExpiration > 0 && daysUntilExpiration <= 7;
  const isWarning = daysUntilExpiration > 7 && daysUntilExpiration <= 30;

  const documentName = documentType === 'Licenca' ? 'Licença' : 'Seguro';
  const previewText = isExpired
    ? `${documentName} vencida - Ação necessária`
    : `${documentName} vence em ${daysUntilExpiration} dias`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with warning icon */}
          <Section style={headerSection}>
            <Text style={warningIcon}>⚠️</Text>
            <Heading style={h1}>
              {isExpired ? 'Documento Vencido' : 'Lembrete de Vencimento'}
            </Heading>
          </Section>

          {/* Greeting */}
          <Text style={text}>Olá {subcontractorName},</Text>

          {/* Message based on status */}
          {isExpired && (
            <Text style={text}>
              Seu <strong>{documentName}</strong> venceu em{' '}
              <strong>{expirationDate}</strong>.
            </Text>
          )}

          {!isExpired && (
            <Text style={text}>
              Seu <strong>{documentName}</strong> vence em{' '}
              <strong>{daysUntilExpiration} dia(s)</strong> (
              {expirationDate}).
            </Text>
          )}

          {/* Warning box with urgency level */}
          <Section
            style={{
              ...warningBox,
              backgroundColor: isExpired
                ? '#FEE2E2'
                : isUrgent
                ? '#FED7AA'
                : '#FEF3C7',
              borderLeftColor: isExpired
                ? '#DC2626'
                : isUrgent
                ? '#EA580C'
                : '#D97706',
            }}
          >
            <Text style={warningText}>
              {isExpired && (
                <>
                  <strong>ATENÇÃO:</strong> Documentos vencidos podem resultar
                  em suspensão de trabalhos. Por favor, atualize imediatamente.
                </>
              )}
              {isUrgent && !isExpired && (
                <>
                  <strong>URGENTE:</strong> Seu documento vence em breve.
                  Atualize o mais rápido possível para evitar interrupções.
                </>
              )}
              {isWarning && !isExpired && !isUrgent && (
                <>
                  <strong>IMPORTANTE:</strong> Mantenha sua documentação
                  atualizada para continuar recebendo trabalhos.
                </>
              )}
            </Text>
          </Section>

          {/* Action button */}
          <Section style={buttonSection}>
            <Button style={button} href={actionUrl}>
              Atualizar {documentName}
            </Button>
          </Section>

          {/* Footer */}
          <Text style={footer}>
            Este é um lembrete automático. Você receberá notificações 30 dias,
            7 dias e no dia do vencimento.
          </Text>
          <Text style={footer}>
            Se você já atualizou seu {documentName.toLowerCase()}, desconsidere
            este email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#F3F4F6',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  backgroundColor: '#FFFFFF',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
  borderRadius: '8px',
};

const headerSection = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const warningIcon = {
  fontSize: '48px',
  margin: '0',
  lineHeight: '1',
};

const h1 = {
  color: '#1F2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '16px 0 0 0',
  textAlign: 'center' as const,
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const warningBox = {
  padding: '16px',
  borderRadius: '6px',
  borderLeftWidth: '4px',
  borderLeftStyle: 'solid' as const,
  margin: '24px 0',
};

const warningText = {
  color: '#1F2937',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#2563EB',
  borderRadius: '6px',
  color: '#FFFFFF',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const footer = {
  color: '#6B7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
  textAlign: 'center' as const,
};

export default ComplianceReminderEmail;
