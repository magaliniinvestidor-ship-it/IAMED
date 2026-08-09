export type ReminderLanguage =
  | ''
  | 'es'
  | 'gn'
  | 'pt'
  | 'pt-BR'
  | 'pt-PT'
  | 'es-AR'
  | 'es-PY'
  | 'en';

export type MessageLangKey = 'messageEs' | 'messageGn' | 'messagePt' | 'messageEn';

export interface WhatsAppTemplate {
  id: string;
  nameKey: string;
  hoursBefore: number;
  messageEs: string;
  messageGn: string;
  messagePt: string;
  messageEn: string;
}

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  { id: 'tpl_1', nameKey: 'agenda_reminder_48h', hoursBefore: 48, messageEs: 'Hola {nombre}. Le recordamos su consulta con {profesional} el {fecha} a las {hora} en {sede}. Responda: 1=Confirmar, 2=Cancelar, 3=Remarcar', messageGn: 'Hola {nombre}. Rembiapoite upeicha rendaite con {profesional} {fecha} {hora} en {sede}. Jawepy: 1=Jepive, 2=Ñanomboya, 3=Tembiapo ipahague', messagePt: 'Olá {nombre}. Lembramos sua consulta com {profesional} em {fecha} às {hora} em {sede}. Responda: 1=Confirmar, 2=Cancelar, 3=Remarcar', messageEn: 'Hello {nombre}. We remind you of your appointment with {profesional} on {fecha} at {hora} at {sede}. Reply: 1=Confirm, 2=Cancel, 3=Reschedule' },
  { id: 'tpl_2', nameKey: 'agenda_reminder_24h', hoursBefore: 24, messageEs: 'Hola {nombre}. Mañana tiene consulta con {profesional} a las {hora} en {sede}. Por favor confirme su asistencia.', messageGn: 'Hola {nombre}. Arange upeicha rendaite con {profesional} {hora} en {sede}. Ikatu peẽ jepive.', messagePt: 'Olá {nombre}. Amanhã você tem consulta com {profesional} às {hora} em {sede}. Por favor confirme.', messageEn: 'Hello {nombre}. You have an appointment with {profesional} tomorrow at {hora} at {sede}. Please confirm.' },
  { id: 'tpl_3', nameKey: 'agenda_reminder_2h', hoursBefore: 2, messageEs: 'Hola {nombre}. Su consulta con {profesional} es en 2 horas en {sede}. Lo esperamos.', messageGn: 'Hola {nombre}. Upicha rendaite con {profesional} ha e\'ho 2 horas en {sede}. Jaha jave.', messagePt: 'Olá {nombre}. Sua consulta com {profesional} é em 2 horas em {sede}. Aguardamos você.', messageEn: 'Hello {nombre}. Your appointment with {profesional} is in 2 hours at {sede}. We look forward to seeing you.' },
];

export const getLangMessageKey = (lang: string): MessageLangKey => {
  if (lang === 'gn') return 'messageGn';
  if (lang === 'en') return 'messageEn';
  if (lang.startsWith('pt')) return 'messagePt';
  return 'messageEs';
};

export interface ReminderMessageContext {
  nombre?: string;
  profesional?: string;
  fecha?: string;
  hora?: string;
  sede?: string;
}

export const buildReminderMessage = (
  tpl: WhatsAppTemplate,
  lang: string,
  ctx: ReminderMessageContext = {},
): string => {
  const raw = tpl[getLangMessageKey(lang)] || tpl.messageEs;
  return raw
    .replace('{nombre}', ctx.nombre ?? '{nombre}')
    .replace('{profesional}', ctx.profesional ?? '{profesional}')
    .replace('{fecha}', ctx.fecha ?? '{fecha}')
    .replace('{hora}', ctx.hora ?? '{hora}')
    .replace('{sede}', ctx.sede ?? '{sede}');
};