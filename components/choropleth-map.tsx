"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

import type { RankingRow, StateStackupSummary } from "@/lib/types";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

type ChoroplethMapProps = {
  rows: RankingRow[];
  stateSummaries: StateStackupSummary[];
};

function fillColor(percentile: number) {
  if (percentile >= 80) return "#0f8b8d";
  if (percentile >= 60) return "#4fb4b5";
  if (percentile >= 40) return "#a9d6d5";
  if (percentile >= 20) return "#f6d99a";

  return "#efb366";
}

export function ChoroplethMap({ rows, stateSummaries }: ChoroplethMapProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rowByFips = new Map(rows.map((row) => [row.jurisdiction.fips, row]));
  const summaryByFips = new Map(
    stateSummaries.map((summary) => [summary.jurisdiction.fips, summary])
  );
  const [hovered, setHovered] = useState<{
    summary: StateStackupSummary;
    position: { x: number; y: number };
  } | null>(null);

  function updateTooltipPosition(event: MouseEvent<SVGPathElement>) {
    const bounds = containerRef.current?.getBoundingClientRect();

    if (!bounds) {
      return { x: 0, y: 0 };
    }

    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top
    };
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-white p-4"
    >
      <ComposableMap projection="geoAlbersUsa" className="h-auto w-full">
        <Geographies geography={GEO_URL}>
          {({ geographies }: { geographies: Array<{ id: string | number; rsmKey: string }> }) =>
            geographies.map((geography: { id: string | number; rsmKey: string }) => {
              const fips = String(geography.id).padStart(2, "0");
              const row = rowByFips.get(fips);
              const summary = summaryByFips.get(fips);

              return (
                <Geography
                  key={geography.rsmKey}
                  geography={geography}
                  tabIndex={summary ? 0 : -1}
                  role={summary ? "link" : undefined}
                  aria-label={
                    summary
                      ? `Open ${summary.jurisdiction.name} in the states explorer`
                      : undefined
                  }
                  stroke="#f8fafc"
                  strokeWidth={0.75}
                  fill={row ? fillColor(row.percentile) : "#e7ecef"}
                  onMouseEnter={(event: MouseEvent<SVGPathElement>) => {
                    if (!summary) {
                      return;
                    }

                    setHovered({
                      summary,
                      position: updateTooltipPosition(event)
                    });
                  }}
                  onMouseMove={(event: MouseEvent<SVGPathElement>) => {
                    if (!summary) {
                      return;
                    }

                    setHovered({
                      summary,
                      position: updateTooltipPosition(event)
                    });
                  }}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => {
                    if (!summary) {
                      return;
                    }

                    setHovered({
                      summary,
                      position: { x: 24, y: 24 }
                    });
                  }}
                  onBlur={() => setHovered(null)}
                  onClick={() => {
                    if (!summary) {
                      return;
                    }

                    router.push(`/states?state=${summary.jurisdiction.slug}`);
                  }}
                  onKeyDown={(event: KeyboardEvent<SVGPathElement>) => {
                    if (!summary) {
                      return;
                    }

                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(`/states?state=${summary.jurisdiction.slug}`);
                    }
                  }}
                  style={{
                    default: { outline: "none", cursor: summary ? "pointer" : "default" },
                    hover: {
                      outline: "none",
                      fill: row ? "#0b5f61" : "#d9e4e8",
                      cursor: summary ? "pointer" : "default"
                    },
                    pressed: { outline: "none" }
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
      {hovered ? (
        <div
          className="pointer-events-none absolute z-10 w-72 rounded-3xl border border-border/70 bg-white/95 p-4 shadow-mellow backdrop-blur"
          style={{
            left: Math.min(hovered.position.x + 16, 520),
            top: Math.max(hovered.position.y - 12, 16)
          }}
        >
          <div className="text-sm font-semibold">{hovered.summary.jurisdiction.name}</div>
          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Ranking snapshot
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Best 3
              </div>
              <div className="mt-2 space-y-2 text-sm">
                {hovered.summary.best.map((item) => (
                  <div key={`${hovered.summary.jurisdiction.slug}-${item.metricId}`}>
                    <div className="font-medium">{item.metricLabel}</div>
                    <div className="text-muted-foreground">Rank #{item.rank}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Worst 3
              </div>
              <div className="mt-2 space-y-2 text-sm">
                {hovered.summary.worst.map((item) => (
                  <div key={`${hovered.summary.jurisdiction.slug}-${item.metricId}`}>
                    <div className="font-medium">{item.metricLabel}</div>
                    <div className="text-muted-foreground">Rank #{item.rank}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
