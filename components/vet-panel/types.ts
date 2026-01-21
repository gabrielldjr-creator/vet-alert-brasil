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
  context?: {
    alertDetails?: string[];
    notes?: string;
    eventOnset?: string;
    recentChanges?: string;
    feed?: {
      feedChange?: string;
      feedType?: string;
      feedOrigin?: string;
    } | null;
    pharma?: {
      drugExposure?: string;
      drugCategory?: string;
      drugInterval?: string;
    } | null;
    environment?: {
      environmentSignals?: string[];
      regionalPattern?: string;
    } | null;
    herdCountLabel?: string;
    country?: string;
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
