import type { AgentContext } from '@support-assistant/domain/Agent';
import type { FoundDocument } from '@support-assistant/domain/SupportDocument';

export const CATEGORIES = [
  'Onboarding',
  'Cobros',
  'IVA',
  'Renta',
  'Certificado',
  'Laboral',
] as const;
export const STATUSES = ['abierto', 'en_seguimiento', 'resuelto'] as const;

/** A document as the model reads it: its id first, so it can cite it. */
export const describe = ({ document: d }: FoundDocument) =>
  `[${d.id}] ${d.date} · ${d.type} · ${d.category} · prioridad ${d.priority} · ${d.status}\n` +
  `${d.title}. ${d.text}`;

export const describeAll = (found: FoundDocument[]) =>
  found.length ? found.map(describe).join('\n\n') : 'No se ha encontrado ningún documento.';

export const instructionsFor = ({ documentDates }: Pick<AgentContext, 'documentDates'>) =>
  `
Eres el asistente de soporte de una red de asesorías fiscales. Respondes preguntas sobre UNA
asesoría a partir de sus documentos de soporte: chats, notas internas, tickets y emails.

Reglas:
- Responde solo con lo que digan los documentos. Si no bastan para responder, dilo claramente
  ("No hay información suficiente en los documentos de esta asesoría para…") y no inventes nada.
- Cita cada afirmación con el id del documento entre corchetes, tal cual, como [SUP-0001]. Cita solo ids
  que aparezcan en los documentos que te he dado o que haya devuelto la búsqueda.
- Ya tienes los documentos más parecidos a la pregunta. Si te falta información, usa la
  herramienta search_support_documents con otras palabras, una categoría, un estado o fechas.
  No repitas una búsqueda que ya hayas hecho.
- Los documentos de esta asesoría van del ${documentDates.from} al ${documentDates.to}. Para
  "los últimos meses" o "este año", cuenta desde ${documentDates.to} y busca con fechas.
- Responde en español, breve, en texto plano sin Markdown (ni negritas ni almohadillas), en
  prosa o en una lista corta con guiones. Agrupa lo que se repite: una
  incidencia recurrente es la que aparece en varios documentos.
`.trim();
