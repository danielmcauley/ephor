import { parse } from "csv-parse/sync";

import type { BinaryResponse, TextResponse } from "@/lib/ingest/types";

export async function fetchText(url: string): Promise<TextResponse> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "ephor-dashboard/0.1"
    },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }

  return {
    body: await response.text(),
    sourceUrl: response.url,
    lastModified: response.headers.get("last-modified")
      ? new Date(response.headers.get("last-modified") as string)
      : null
  };
}

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "ephor-dashboard/0.1"
    },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchBuffer(url: string): Promise<BinaryResponse> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "ephor-dashboard/0.1"
    },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }

  return {
    body: Buffer.from(await response.arrayBuffer()),
    sourceUrl: response.url,
    lastModified: response.headers.get("last-modified")
      ? new Date(response.headers.get("last-modified") as string)
      : null
  };
}

export function parseDelimited<T extends Record<string, string>>(body: string, delimiter = "\t") {
  return parse(body, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    delimiter
  }) as T[];
}

export function monthPeriod(year: number, monthIndex: number) {
  const periodStart = new Date(Date.UTC(year, monthIndex, 1));
  const periodEnd = new Date(Date.UTC(year, monthIndex + 1, 0));

  return {
    periodStart,
    periodEnd,
    periodKey: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
    periodLabel: new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC"
    }).format(periodStart)
  };
}

export function quarterPeriod(year: number, quarter: number) {
  const monthIndex = (quarter - 1) * 3;
  const periodStart = new Date(Date.UTC(year, monthIndex, 1));
  const periodEnd = new Date(Date.UTC(year, monthIndex + 3, 0));

  return {
    periodStart,
    periodEnd,
    periodKey: `${year}-Q${quarter}`,
    periodLabel: `Q${quarter} ${year}`
  };
}

export function annualPeriod(year: number) {
  const periodStart = new Date(Date.UTC(year, 0, 1));
  const periodEnd = new Date(Date.UTC(year, 11, 31));

  return {
    periodStart,
    periodEnd,
    periodKey: `${year}`,
    periodLabel: `${year}`
  };
}
