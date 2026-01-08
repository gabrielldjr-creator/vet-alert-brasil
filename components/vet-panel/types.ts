export type AlertRecord = {
  id: string;
  createdAt?: { toDate: () => Date };
  timestamp?: { toDate: () => Date };
  state?: string;
  city?: string;
  species?: string;
  alertType?: string;
  alertGroup?: string;
  severity?: string;
  herdCount?: string;
};

export type VetPanelFiltersState = {
  stateScope: "state" | "neighbors" | "all";
  species: string;
  alertGroup: string;
  severity: string;
  timeWindow: "24h" | "7d" | "30d";
};
