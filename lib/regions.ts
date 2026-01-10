export const stateOptions = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

export type MunicipalityOption = {
  code: number;
  name: string;
  microregion?: string;
  mesoregion?: string;
};

export const fetchMunicipalities = async (state: string): Promise<MunicipalityOption[]> => {
  if (!state) return [];
  const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios?orderBy=nome`);
  if (!response.ok) {
    throw new Error("Falha ao carregar municípios");
  }
  const data = (await response.json()) as Array<{
    id: number;
    nome: string;
    microrregiao?: { nome?: string };
    mesorregiao?: { nome?: string };
  }>;
  return data.map((city) => ({
    code: city.id,
    name: city.nome,
    microregion: city.microrregiao?.nome,
    mesoregion: city.mesorregiao?.nome,
  }));
};
