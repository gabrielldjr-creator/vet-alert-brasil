import type { buildSapsaSummary } from "./aggregation";

type SapsaSummary = ReturnType<typeof buildSapsaSummary>;

function csvValue(value: string | number) {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function renderSapsaCsv(summary: SapsaSummary) {
  const rows: Array<Array<string | number>> = [["stateCode", "species", "signalGroup", "observationCount", "municipalityCount", "periods", "classification", "methodologyVersion"]];
  for (const cell of summary.cells) rows.push([cell.stateCode, cell.species, cell.signalGroup, cell.observationCount, cell.municipalityCount, cell.periods.join("|"), cell.classification, summary.methodology.version]);
  return rows.map((row) => row.map(csvValue).join(",")).join("\r\n");
}
