import assert from "node:assert/strict";
import test from "node:test";
import { validateTechnicalNoteText } from "../lib/v2/technical-note";

// Curated fixture corpus only. It is not a field estimate or a claim of universal coverage.
export const legitimateTechnicalNoteCorpus = [
  "Animais apresentam tosse leve no período recente.",
  "Grupo apresenta espirros e secreção nasal.",
  "Animais apresentam dificuldade respiratória durante o manejo.",
  "Foi observado aumento gradual da frequência respiratória.",
  "Animais permanecem com respiração elevada em repouso.",
  "Grupo apresentou redução da atividade com tosse intermitente.",
  "Foi percebida secreção nasal em animais do grupo.",
  "Animais apresentam ruído respiratório intermitente.",
  "Animais apresentaram redução do apetite no período recente.",
  "Grupo apresenta aumento do consumo de água.",
  "Animais permanecem com baixa ingestão de alimento.",
  "Foi observada variação nas fezes durante o período recente.",
  "Animais apresentam fezes líquidas e apetite baixo.",
  "Grupo apresenta distensão abdominal moderada.",
  "Foi percebido aumento de salivação nos animais.",
  "Animais apresentam regurgitação intermitente.",
  "Grupo apresentou vômitos no período recente.",
  "Animais apresentam claudicação leve durante o deslocamento.",
  "Grupo permanece com dificuldade de locomoção.",
  "Foi observada rigidez durante o movimento.",
  "Animais apresentam redução do apoio durante o deslocamento.",
  "Grupo manteve postura semelhante durante o repouso.",
  "Animais apresentam movimentos leves e intermitentes.",
  "Foi percebida alteração de equilíbrio no grupo.",
  "Animais apresentam tremores durante o repouso.",
  "Grupo apresenta dificuldade de coordenação no período recente.",
  "Foram observadas convulsões intermitentes.",
  "Animais apresentaram alteração de comportamento.",
  "Grupo permanece com nível de alerta elevado.",
  "Animais apresentam alteração reprodutiva recente.",
  "Foi observada manifestação reprodutiva no grupo.",
  "Grupos apresentam manifestações reprodutivas semelhantes.",
  "Animais apresentam secreção reprodutiva intermitente.",
  "Grupo apresentou alteração reprodutiva persistente.",
  "Animais apresentam alteração cutânea leve.",
  "Grupo apresenta prurido persistente.",
  "Foi observada queda de pelo nos animais.",
  "Animais apresentam lesões cutâneas dispersas.",
  "Grupo apresenta edema moderado.",
  "Foi percebida vermelhidão na pele.",
  "Animais apresentam aumento de ocorrências no período recente.",
  "Grupos apresentam padrão coletivo semelhante.",
  "Animais apresentam padrões dispersos no campo.",
  "Foi observada progressão gradual da situação.",
  "Grupo permanece com alteração persistente.",
  "Animais apresentaram início súbito da alteração.",
  "Foi percebida melhora gradual no grupo.",
  "Animais apresentaram piora moderada no período.",
  "Grupos apresentam alterações semelhantes e simultâneas.",
  "Foi observada variação de intensidade entre os grupos.",
] as const;

test("curated legitimate technical-note corpus has no false-positive rejections", () => {
  const rejected = legitimateTechnicalNoteCorpus.filter((note) => !validateTechnicalNoteText(note).ok);
  const rejectionRate = rejected.length / legitimateTechnicalNoteCorpus.length;
  assert.deepEqual(rejected, []);
  assert.equal(rejectionRate, 0);
});
