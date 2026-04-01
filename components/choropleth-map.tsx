"use client";

import { ComposableMap, Geographies, Geography } from "react-simple-maps";

import type { RankingRow } from "@/lib/types";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

type ChoroplethMapProps = {
  rows: RankingRow[];
};

function fillColor(percentile: number) {
  if (percentile >= 80) return "#0f8b8d";
  if (percentile >= 60) return "#4fb4b5";
  if (percentile >= 40) return "#a9d6d5";
  if (percentile >= 20) return "#f6d99a";

  return "#efb366";
}

export function ChoroplethMap({ rows }: ChoroplethMapProps) {
  const rowByFips = new Map(rows.map((row) => [row.jurisdiction.fips, row]));

  return (
    <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-white p-4">
      <ComposableMap projection="geoAlbersUsa" className="h-auto w-full">
        <Geographies geography={GEO_URL}>
          {({ geographies }: { geographies: Array<{ id: string | number; rsmKey: string }> }) =>
            geographies.map((geography: { id: string | number; rsmKey: string }) => {
              const row = rowByFips.get(String(geography.id).padStart(2, "0"));

              return (
                <Geography
                  key={geography.rsmKey}
                  geography={geography}
                  stroke="#f8fafc"
                  strokeWidth={0.75}
                  fill={row ? fillColor(row.percentile) : "#e7ecef"}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: row ? "#0b5f61" : "#d9e4e8" },
                    pressed: { outline: "none" }
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}
