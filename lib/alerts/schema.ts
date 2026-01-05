export type SpeciesOption = "cavalo" | "bovino" | "cao" | "gato" | "ave" | "outro";
export type EventCategory =
  | "intoxicacao"
  | "surtos"
  | "contaminacao"
  | "reacao-adversa"
  | "mortalidade-incomum"
  | "outro";
export type SuspectedSource = "racao" | "feno" | "planta" | "medicamento" | "desconhecido";

export interface AlertSignal {
  species: SpeciesOption;
  category: EventCategory;
  source: SuspectedSource;
  region: string;
  reportedAt: string;
  note?: string;
}

export interface ClusterCandidate {
  id: string;
  signals: number;
  regions: string[];
  categories: EventCategory[];
  sources: SuspectedSource[];
  timespanHours: number;
}

export const speciesOptions: { value: SpeciesOption; label: string }[] = [
  { value: "cavalo", label: "Cavalo" },
  { value: "bovino", label: "Bovino" },
  { value: "cao", label: "Cão" },
  { value: "gato", label: "Gato" },
  { value: "ave", label: "Ave" },
  { value: "outro", label: "Outro" },
];

export const categoryOptions: { value: EventCategory; label: string }[] = [
  { value: "intoxicacao", label: "Intoxicação" },
  { value: "contaminacao", label: "Suspeita de contaminação" },
  { value: "reacao-adversa", label: "Reação adversa incomum" },
  { value: "surtos", label: "Agregação incomum" },
  { value: "mortalidade-incomum", label: "Mortalidade incomum" },
  { value: "outro", label: "Outro" },
];

export const sourceOptions: { value: SuspectedSource; label: string }[] = [
  { value: "racao", label: "Ração / concentrado" },
  { value: "feno", label: "Feno ou forragem" },
  { value: "planta", label: "Planta tóxica" },
  { value: "medicamento", label: "Medicamento" },
  { value: "desconhecido", label: "Desconhecido" },
];
