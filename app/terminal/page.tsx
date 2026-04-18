"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type TerminalEvent = {
  timestamp?: string;
  state?: string;
  city?: string;
  species?: string;
  alert_type?: string;
  number_of_cases?: number | string;
  cases?: number | string;
};

type SignalAlert = {
  type?: string;
  location?: string;
  confidence_score?: number;
  related_events?: Array<Record<string, unknown>>;
};

type StreamMessage = {
  type?: "event" | "heartbeat";
  data?: TerminalEvent;
  message?: string;
  mode?: "live" | "replay";
};

type MapPoint = {
  lat: number;
  lng: number;
  count: number;
  label: string;
};

function formatEventLine(event: TerminalEvent): string {
  const timestamp = event.timestamp ?? "--:--:--";
  const state = event.state ?? "N/A";
  const species = event.species ?? "N/A";
  const alertType = event.alert_type ?? "N/A";
  const cases = event.number_of_cases ?? event.cases ?? 0;
  return `[${timestamp}] ${state} | ${species} | ${alertType} | ${cases}`;
}

function shortExplanation(alert: SignalAlert): string {
  const relatedCount = Array.isArray(alert.related_events) ? alert.related_events.length : 0;
  const confidence = typeof alert.confidence_score === "number" ? alert.confidence_score : 0;
  return `${relatedCount} eventos relacionados • confiança ${Math.round(confidence * 100)}%`;
}

function hashToUnit(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 10000) / 10000;
}

function eventToLatLng(event: TerminalEvent): { lat: number; lng: number } {
  const seed = `${event.state ?? ""}|${event.city ?? ""}`;
  const latSeed = hashToUnit(`lat:${seed}`);
  const lngSeed = hashToUnit(`lng:${seed}`);

  // Rough Brazil bounding box for synthetic plotting.
  const lat = -33 + latSeed * 28; // [-33, -5]
  const lng = -74 + lngSeed * 40; // [-74, -34]

  return { lat, lng };
}

function buildClusterPoints(events: TerminalEvent[]): MapPoint[] {
  const grid = new Map<string, MapPoint>();

  for (const event of events) {
    const { lat, lng } = eventToLatLng(event);
    const gridLat = Math.round(lat * 2) / 2;
    const gridLng = Math.round(lng * 2) / 2;
    const key = `${gridLat}:${gridLng}`;
    const label = `${event.city ?? "Município"} - ${event.state ?? "UF"}`;

    const current = grid.get(key);
    if (current) {
      current.count += 1;
      continue;
    }

    grid.set(key, {
      lat: gridLat,
      lng: gridLng,
      count: 1,
      label,
    });
  }

  return Array.from(grid.values());
}

function latLngToCanvas(point: MapPoint): { x: number; y: number } {
  const minLat = -33;
  const maxLat = -5;
  const minLng = -74;
  const maxLng = -34;

  const x = ((point.lng - minLng) / (maxLng - minLng)) * 100;
  const y = (1 - (point.lat - minLat) / (maxLat - minLat)) * 100;

  return { x, y };
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

function resolveApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_TERMINAL_API_BASE;
  if (configured && configured.trim()) {
    return trimTrailingSlash(configured.trim());
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}

function resolveWsBase(apiBase: string): string {
  const configured = process.env.NEXT_PUBLIC_TERMINAL_WS_BASE;
  if (configured && configured.trim()) {
    return trimTrailingSlash(configured.trim());
  }

  if (apiBase.startsWith("https://")) return `wss://${apiBase.slice("https://".length)}`;
  if (apiBase.startsWith("http://")) return `ws://${apiBase.slice("http://".length)}`;

  if (typeof window !== "undefined") {
    return `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`;
  }

  return "";
}

export default function TerminalPage() {
  const [eventLines, setEventLines] = useState<string[]>([]);
  const [eventRecords, setEventRecords] = useState<TerminalEvent[]>([]);
  const [alerts, setAlerts] = useState<SignalAlert[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "open" | "closed" | "error">(
    "connecting",
  );
  const [streamMode, setStreamMode] = useState<"live" | "replay">("live");

  const feedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const apiBase = resolveApiBase();
    const wsBase = resolveWsBase(apiBase);
    const socket = new WebSocket(`${wsBase}/terminal/stream?mode=${streamMode}`);

    socket.onopen = () => setConnectionStatus("open");
    socket.onclose = () => setConnectionStatus("closed");
    socket.onerror = () => setConnectionStatus("error");

    socket.onmessage = (message) => {
      try {
        const payload = JSON.parse(message.data) as StreamMessage;
        const eventData = payload.data;
        if (payload.type !== "event" || !eventData) {
          return;
        }

        const line = formatEventLine(eventData);
        setEventLines((current) => [...current, line].slice(-300));
        setEventRecords((current) => [...current, eventData].slice(-300));
      } catch {
        // Ignore malformed messages to keep the stream running.
      }
    };

    return () => {
      socket.close();
    };
  }, [streamMode]);

  useEffect(() => {
    let isMounted = true;

    const fetchAlerts = async () => {
      try {
        const apiBase = resolveApiBase();
        const response = await fetch(`${apiBase}/terminal/alerts`, { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as SignalAlert[];
        if (isMounted) {
          setAlerts(Array.isArray(payload) ? payload : []);
        }
      } catch {
        // Keep current alerts on network error.
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const node = feedRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [eventLines]);

  const mapPoints = useMemo(() => buildClusterPoints(eventRecords), [eventRecords]);

  const statusLabel = useMemo(() => {
    if (connectionStatus === "open") return "Conectado";
    if (connectionStatus === "connecting") return "Conectando...";
    if (connectionStatus === "error") return "Erro de conexão";
    return "Desconectado";
  }, [connectionStatus]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 p-4 lg:h-screen lg:flex-row lg:overflow-hidden lg:p-6">
        <section className="flex min-h-[260px] flex-1 flex-col rounded-2xl border border-slate-800 bg-slate-900/70">
          <header className="border-b border-slate-800 px-4 py-3">
            <h1 className="text-sm font-semibold uppercase tracking-wide text-emerald-300">Live Event Feed</h1>
            <p className="text-xs text-slate-400">WebSocket /terminal/stream • {statusLabel}</p>
            <p className="text-[11px] text-slate-500">API base: {resolveApiBase() || "não configurado"}</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setConnectionStatus("connecting");
                  setStreamMode("live");
                  setEventLines([]);
                  setEventRecords([]);
                }}
                className={[
                  "rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide",
                  streamMode === "live"
                    ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                    : "border-slate-700 bg-slate-900/60 text-slate-300",
                ].join(" ")}
              >
                Live
              </button>
              <button
                type="button"
                onClick={() => {
                  setConnectionStatus("connecting");
                  setStreamMode("replay");
                  setEventLines([]);
                  setEventRecords([]);
                }}
                className={[
                  "rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide",
                  streamMode === "replay"
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                    : "border-slate-700 bg-slate-900/60 text-slate-300",
                ].join(" ")}
              >
                Replay
              </button>
            </div>
          </header>
          <div ref={feedRef} className="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs leading-relaxed">
            <ul className="space-y-1">
              {eventLines.map((line, index) => (
                <li key={`${line}-${index}`} className="rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="flex min-h-[220px] flex-[1.2] flex-col rounded-2xl border border-slate-800 bg-slate-900/70">
          <header className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-cyan-300">Alert Stream</h2>
            <p className="text-xs text-slate-400">Atualização automática a cada 5 segundos</p>
          </header>
          <div className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-3">
              {alerts.map((alert, index) => (
                <li
                  key={`${alert.type ?? "unknown"}-${alert.location ?? "unknown"}-${index}`}
                  className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3"
                >
                  <p className="text-sm font-semibold text-amber-300">
                    ⚠️ [{(alert.type ?? "unknown").toUpperCase()}]
                  </p>
                  <p className="text-sm text-slate-100">{alert.location ?? "unknown"}</p>
                  <p className="text-xs text-slate-400">{shortExplanation(alert)}</p>
                </li>
              ))}
              {alerts.length === 0 ? (
                <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-400">
                  Sem alertas detectados no momento.
                </li>
              ) : null}
            </ul>
          </div>
        </section>

        <section className="flex min-h-[220px] w-full flex-col rounded-2xl border border-slate-800 bg-slate-900/70 lg:max-w-[330px]">
          <header className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-300">Map</h2>
            <p className="text-xs text-slate-400">Cluster visual (canvas-style) por região</p>
          </header>
          <div className="flex flex-1 p-3">
            <div className="relative h-full min-h-[220px] w-full overflow-hidden rounded-xl border border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.12),transparent_70%)]" />
              {mapPoints.map((point, index) => {
                const { x, y } = latLngToCanvas(point);
                const size = Math.min(14 + point.count * 2, 34);
                return (
                  <div
                    key={`${point.label}-${index}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-300/70 bg-amber-500/35 shadow-[0_0_12px_rgba(251,146,60,0.35)]"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: `${size}px`,
                      height: `${size}px`,
                    }}
                    title={`${point.label} • Eventos: ${point.count}`}
                  />
                );
              })}
              <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-slate-950/70 px-2 py-1 text-[10px] text-slate-300">
                Pontos agrupados: {mapPoints.length}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
