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

type MapPoint = {
  lat: number;
  lng: number;
  count: number;
  label: string;
};

type LeafletNS = typeof import("leaflet");

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

export default function TerminalPage() {
  const [eventLines, setEventLines] = useState<string[]>([]);
  const [eventRecords, setEventRecords] = useState<TerminalEvent[]>([]);
  const [alerts, setAlerts] = useState<SignalAlert[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "open" | "closed" | "error">(
    "connecting",
  );
  const [mapReady, setMapReady] = useState(false);

  const feedRef = useRef<HTMLDivElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const leafletRef = useRef<LeafletNS | null>(null);

  useEffect(() => {
    let mounted = true;

    const setupMap = async () => {
      if (!mapContainerRef.current || mapRef.current) return;

      const L = await import("leaflet");
      if (!mounted || !mapContainerRef.current) return;

      leafletRef.current = L;
      const map = L.map(mapContainerRef.current, {
        center: [-15.8, -47.9],
        zoom: 4,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      mapRef.current = map;
      layerRef.current = layerGroup;
      setMapReady(true);
    };

    setupMap();

    return () => {
      mounted = false;
      layerRef.current?.clearLayers();
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${window.location.host}/terminal/stream`);

    socket.onopen = () => setConnectionStatus("open");
    socket.onclose = () => setConnectionStatus("closed");
    socket.onerror = () => setConnectionStatus("error");

    socket.onmessage = (message) => {
      try {
        const payload: TerminalEvent = JSON.parse(message.data);
        const line = formatEventLine(payload);
        setEventLines((current) => [...current, line].slice(-300));
        setEventRecords((current) => [...current, payload].slice(-300));
      } catch {
        // Ignore malformed messages to keep the stream running.
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchAlerts = async () => {
      try {
        const response = await fetch("/terminal/alerts", { cache: "no-store" });
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

  useEffect(() => {
    if (!mapReady || !leafletRef.current || !layerRef.current) return;

    const L = leafletRef.current;
    const layer = layerRef.current;
    const points = buildClusterPoints(eventRecords);

    layer.clearLayers();

    points.forEach((point) => {
      const radius = Math.min(8 + point.count * 1.5, 24);
      const marker = L.circleMarker([point.lat, point.lng], {
        radius,
        color: "#f59e0b",
        fillColor: "#f97316",
        fillOpacity: 0.45,
        weight: 1,
      });
      marker.bindTooltip(`${point.label}<br/>Eventos: ${point.count}`, { direction: "top" });
      marker.addTo(layer);
    });
  }, [eventRecords, mapReady]);

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
            <p className="text-xs text-slate-400">Eventos plotados e agrupados visualmente</p>
          </header>
          <div className="flex flex-1 p-3">
            <div className="h-full min-h-[220px] w-full overflow-hidden rounded-xl border border-slate-700">
              <div ref={mapContainerRef} className="h-full min-h-[220px] w-full" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
