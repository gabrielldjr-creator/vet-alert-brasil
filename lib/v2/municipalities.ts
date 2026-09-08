import catalog from "./data/ibge-municipalities-2025.json";

export const IBGE_MUNICIPALITY_CATALOG_VERSION = catalog.schemaVersion;
export const IBGE_MUNICIPALITY_CATALOG_SOURCE = catalog.source;
export const IBGE_MUNICIPALITY_CATALOG_RETRIEVED_AT = catalog.retrievedAt;

export type OfficialMunicipality = {
  code: number;
  name: string;
  stateCode: string;
};

const municipalities = catalog.municipalities as OfficialMunicipality[];
const municipalityByCode = new Map(municipalities.map((municipality) => [String(municipality.code), municipality]));
const municipalitiesByState = new Map<string, OfficialMunicipality[]>();

for (const municipality of municipalities) {
  const current = municipalitiesByState.get(municipality.stateCode) ?? [];
  current.push(municipality);
  municipalitiesByState.set(municipality.stateCode, current);
}

export function getOfficialMunicipalitiesByState(stateCode: string) {
  return (municipalitiesByState.get(stateCode) ?? []).map(({ code, name }) => ({ code, name }));
}

export function isOfficialMunicipalityPair(stateCode: string, municipalityCode: string) {
  const municipality = municipalityByCode.get(municipalityCode);
  return municipality?.stateCode === stateCode;
}

export function getOfficialMunicipalityCatalogStats() {
  return { municipalityCount: municipalities.length, stateCount: municipalitiesByState.size };
}
