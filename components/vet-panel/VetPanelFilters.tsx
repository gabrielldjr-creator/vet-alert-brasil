import { Select } from "../Select";
import { VetPanelFiltersState } from "./types";

type FilterOption = {
  value: string;
  label: string;
};

export type VetPanelFiltersProps = {
  filters: VetPanelFiltersState;
  onChange: (next: VetPanelFiltersState) => void;
  stateLabel: string;
  speciesOptions: string[];
  alertGroupOptions: string[];
  municipalityOptions: string[];
  regionIBGEOptions: string[];
  severityOptions: string[];
  timeWindowOptions: FilterOption[];
};

const scopeOptions = (stateLabel: string): FilterOption[] => [
  { value: "state", label: `Meu estado (${stateLabel})` },
  { value: "neighbors", label: "Vizinhos" },
  { value: "all", label: "Brasil" },
];

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
      active ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-700",
    ].join(" ")}
  >
    {label}
  </button>
);

export function VetPanelFilters({
  filters,
  onChange,
  stateLabel,
  speciesOptions,
  alertGroupOptions,
  municipalityOptions,
  regionIBGEOptions,
  severityOptions,
  timeWindowOptions,
}: VetPanelFiltersProps) {
  const updateFilter = (partial: Partial<VetPanelFiltersState>) => {
    onChange({ ...filters, ...partial });
  };

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Filtros rápidos</p>
        <p className="text-sm text-slate-600">Refine por escopo, espécie, gravidade e janela de tempo.</p>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Escopo regional</p>
        <div className="flex flex-wrap gap-2">
          {scopeOptions(stateLabel).map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              active={filters.stateScope === option.value}
              onClick={() => updateFilter({ stateScope: option.value as VetPanelFiltersState["stateScope"] })}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Espécie</p>
        <div className="flex flex-wrap gap-2">
          <Chip
            label="Todas"
            active={filters.species === ""}
            onClick={() => updateFilter({ species: "" })}
          />
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
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Grupo de alerta</p>
        <div className="flex flex-wrap gap-2">
          <Chip
            label="Todos"
            active={filters.alertGroup === ""}
            onClick={() => updateFilter({ alertGroup: "" })}
          />
          {alertGroupOptions.map((option) => (
            <Chip
              key={option}
              label={option}
              active={filters.alertGroup === option}
              onClick={() => updateFilter({ alertGroup: option })}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Município</p>
        <Select
          label="Município"
          name="municipio"
          value={filters.municipality}
          onChange={(event) => updateFilter({ municipality: event.target.value })}
          helper="Filtra por município selecionado."
          disabled={municipalityOptions.length === 0}
        >
          <option value="all">Todos</option>
          {municipalityOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Região (epidemiológica)</p>
        <Select
          label="Região (epidemiológica)"
          name="regiao-epidemiologica"
          value={filters.regionIBGE}
          onChange={(event) => updateFilter({ regionIBGE: event.target.value })}
          helper="Usa a região epidemiológica do IBGE para agrupar municípios."
          disabled={regionIBGEOptions.length === 0}
        >
          <option value="all">Todas</option>
          {regionIBGEOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gravidade</p>
        <div className="flex flex-wrap gap-2">
          <Chip
            label="Todas"
            active={filters.severity === ""}
            onClick={() => updateFilter({ severity: "" })}
          />
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
