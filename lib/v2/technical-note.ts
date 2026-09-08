export const TECHNICAL_NOTE_SCHEMA_VERSION = "technical-note-v1" as const;
export const TECHNICAL_NOTE_POLICY_VERSION = "technical-note-fail-closed-2026-09-07" as const;
export const TECHNICAL_NOTE_DICTIONARY_VERSION = "technical-note-dictionary-pt-BR-2026-09-07-v2" as const;
export const TECHNICAL_NOTE_MAX_LENGTH = 280;
export const TECHNICAL_NOTE_GENERIC_ERROR = "A nota técnica não pode ser enviada neste formato. Remova dados específicos e reformule usando somente linguagem observacional genérica.";

const safeVocabulary = new Set(`
  a ao aos as com como da das de desde do dos durante e em entre foi foram ha mais mas menos na nas no nos o os ou para pela pelas pelo pelos por que sem sob um uma
  animal animais grupo grupos individuo individuos
  apresenta apresentam apresentou apresentaram permanece permanecem manteve mantiveram ocorreu ocorreram observado observada observados observadas percebido percebida percebidos percebidas
  alteracao alteracoes aumento aumentou aumentaram baixa baixo diminuiu diminuiram dificuldade dificuldades frequencia intensidade inicio manutencao melhora melhorou piora piorou progressao reducao reduziu resposta variacao
  atual recente recentes gradual subita subito persistente persistentes intermitente intermitentes leve leves moderada moderadas moderado moderados elevada elevadas elevado elevados
  atividade alerta apoio apetite agua alimento alimentacao ambiente comportamento consumo contato cuidado deslocamento ingestao locomocao manejo movimento movimentos postura repouso rotina
  abdominal corporal cutanea cutaneas dermatologica dermatologicas digestiva digestivas locomotora locomotoras nasal nasais neurologica neurologicas respiracao respiratoria respiratorias reprodutiva reprodutivas secrecao secrecoes
  claudicacao convulsao convulsoes coordenacao diarreia distensao edema edemas equilibrio espirro espirros fezes lesao lesoes liquida liquidas manifestacao manifestacoes nivel pele pelo pelos prurido queda regurgitacao respiratorio respiratorios rigidez ruido ruidos salivacao tremor tremores tosse vermelhidao vomito vomitos
  coletivo coletivos compativel compativeis concentrado concentrados dispersa dispersas disperso dispersos semelhante semelhantes simultanea simultaneas simultaneo simultaneos
  acompanhamento campo contexto evolucao ocorrencia ocorrencias periodo padrao padroes registro registros situacao situacoes
`.trim().split(/\s+/));

const observationAnchors = new Set([
  "apresenta", "apresentam", "apresentou", "apresentaram", "permanece", "permanecem", "manteve", "mantiveram",
  "ocorreu", "ocorreram", "observado", "observada", "observados", "observadas", "percebido", "percebida", "percebidos", "percebidas",
  "aumentou", "aumentaram", "diminuiu", "diminuiram", "melhorou", "piorou", "reduziu",
]);

const prohibitedTerms = new Set([
  "crmv", "cpf", "cnpj", "email", "telefone", "whatsapp", "url", "site",
  "produtor", "produtora", "proprietario", "proprietaria", "fazenda", "sitio", "chacara", "granja", "propriedade",
  "rua", "avenida", "rodovia", "estrada", "bairro", "cep", "endereco",
  "empresa", "companhia", "cooperativa", "frigorifico", "fabricante", "marca", "produto", "ltda", "eireli",
  "zoetis", "elanco", "boehringer", "ingelheim", "merck", "msd", "ceva", "hipra", "bayer", "jbs", "brf", "minerva", "purina",
  "draxxin", "ivomec", "baytril", "terramicina", "frontline", "bravecto", "simparic", "nexgard", "cobactan",
  "doenca", "diagnostico", "diagnostica", "suspeita", "suspeito", "surto", "notificacao", "notificar", "causa", "causal",
]);

const externalIdentifierPatterns = [
  /https?:\/\//i,
  /\bwww\./i,
  /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i,
  /\b(?:[a-z0-9-]+\.)+(?:com|com\.br|net|org|org\.br|gov\.br|vet\.br)\b/i,
  /\bcrmv[\s.:/-]*[a-z]{0,2}[\s.:/-]*\d+/i,
  /\b(?:cpf|cnpj|rg|cep)[\s.:/-]*\d+/i,
  /\d/,
];

export type TechnicalNoteV1 = {
  schemaVersion: typeof TECHNICAL_NOTE_SCHEMA_VERSION;
  text: string;
};

export type TechnicalNoteValidationResult =
  | { ok: true; value: string }
  | { ok: false; reason: "type" | "length" | "pattern" | "vocabulary" | "uncertain" };

export function normalizeTechnicalNote(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export function validateTechnicalNoteText(value: unknown): TechnicalNoteValidationResult {
  if (typeof value !== "string") return { ok: false, reason: "type" };
  const text = value.trim();
  if (text.length < 10 || text.length > TECHNICAL_NOTE_MAX_LENGTH) return { ok: false, reason: "length" };
  if (/\r|\n|\t/.test(text) || !/^[\p{L}\s.,;:!?()\-]+$/u.test(text) || externalIdentifierPatterns.some((pattern) => pattern.test(text))) {
    return { ok: false, reason: "pattern" };
  }

  const normalized = normalizeTechnicalNote(text);
  const tokens = normalized.match(/[a-z]+/g) ?? [];
  if (tokens.some((token) => prohibitedTerms.has(token))) return { ok: false, reason: "pattern" };
  if (tokens.length < 3 || tokens.some((token) => !safeVocabulary.has(token))) return { ok: false, reason: "vocabulary" };
  if (!tokens.some((token) => observationAnchors.has(token))) return { ok: false, reason: "uncertain" };
  return { ok: true, value: text };
}
