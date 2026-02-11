export type AlertRecord = {
  id: string;
  createdAt?: { toDate: () => Date };
  timestamp?: { toDate: () => Date };
  state?: string;
  city?: string;
  cityCode?: number;
  cityName?: string;
  regionGroup?: string;
  regionIBGE?: string;
  municipality?: string;
  localidadeAproximada?: string;
  species?: string;
  alertType?: string;
  alertGroup?: string;
  severity?: string;
  cases?: number;
  herdCount?: string;
  arrival_context?: {
    when_called?: string;
    situation_found?: string;
    external_factors?: string[];
    optional_note?: string;
  } | null;
  context?: {
    alertDetails?: string[];
    notes?: string;
    eventOnset?: string;
    recentChanges?: string;
    feed?: {
      feedChange?: string;
      feedType?: string[] | string;
      feedOrigin?: string;
    } | null;
    pharma?: {
      drugExposure?: string;
      drugCategory?: string[] | string;
      drugInterval?: string;
    } | null;
    environment?: {
      environmentSignals?: string[];
      regionalPattern?: string;
    } | null;
    herdCountLabel?: string;
    country?: string;
    parasiteObservation?: string;
  };
};

export type VetPanelFiltersState = {
  stateScope: "all" | "SC" | "MT";
  species: string;
  alertGroup: string;
  severity: string;
  regionIBGE: "all" | string;
  municipality: "all" | string;
  timeWindow: "24h" | "7d" | "30d";
};
