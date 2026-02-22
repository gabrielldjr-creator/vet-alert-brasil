import { VetPanelFiltersState } from "./types";

type FilterOption = {
  value: string;
  label: string;
};

export type VetPanelFiltersProps = {
  filters: VetPanelFiltersState;
  onChange: (next: VetPanelFiltersState) => void;
  speciesOptions: string[];
  alertGroupOptions: string[];
  municipalityOptions: string[];
  regionIBGEOptions: string[];
  severityOptions: string[];
  timeWindowOptions: FilterOption[];
  macroRegionOptions: FilterOption[];
  stateOptions: FilterOption[];
  showStateOptions: boolean;
};

const Chip = ({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      "rounded-full border px-4 py-2 text-sm font-semibold transition",
      active ? "border-slate-500 bg-slate-100 text-slate-900" : "border-slate-200 text-slate-700",
    ].join(" ")}
  >
    {label}
  </button>
);

export function VetPanelFilters({
  filters,
  onChange,
  speciesOptions,
  severityOptions,
  timeWindowOptions,
  macroRegionOptions,
  stateOptions,
  showStateOptions,
}: VetPanelFiltersProps) {
  const updateFilter = (partial: Partial<VetPanelFiltersState>) => {
    onChange({ ...filters, ...partial });
  };

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">Filtros clínicos</p>
        <p className="text-sm text-slate-600">Ajuste recortes agregados de macrorregião, estado, espécie e período.</p>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Macrorregião</p>
        <div className="flex flex-wrap gap-2">
          {macroRegionOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              active={filters.macroRegion === option.value}
              onClick={() => updateFilter({ macroRegion: option.value, stateScope: "all" })}
            />
          ))}
        </div>
      </div>

      {showStateOptions && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estado (visão agregada)</p>
          <div className="flex flex-wrap gap-2">
            <Chip label="Todos" active={filters.stateScope === "all"} onClick={() => updateFilter({ stateScope: "all" })} />
            {stateOptions.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                active={filters.stateScope === option.value}
                onClick={() => updateFilter({ stateScope: option.value })}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Espécie</p>
        <div className="flex flex-wrap gap-2">
          <Chip label="Todas" active={filters.species === ""} onClick={() => updateFilter({ species: "" })} />
          {speciesOptions.map((option) => (
            <Chip
              key={option}
              label={option}
              active={filters.species === option}
              onClick={() => updateFilter({ species: option })}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prioridade de atendimento</p>
        <div className="flex flex-wrap gap-2">
          <Chip label="Todas" active={filters.severity === ""} onClick={() => updateFilter({ severity: "" })} />
          {severityOptions.map((option) => (
            <Chip
              key={option}
              label={option}
              active={filters.severity === option}
              onClick={() => updateFilter({ severity: option })}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Janela de tempo</p>
        <div className="flex flex-wrap gap-2">
          {timeWindowOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              active={filters.timeWindow === option.value}
              onClick={() => updateFilter({ timeWindow: option.value as VetPanelFiltersState["timeWindow"] })}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
