import type { MetricDefinition } from "@/lib/types";
import {
  formatCompactNumber,
  formatCurrency,
  formatCurrencyPrecise,
  formatIndex,
  formatPercent,
  formatRate
} from "@/lib/utils";

export function formatMetricValue(metric: Pick<MetricDefinition, "unit">, value: number) {
  switch (metric.unit) {
    case "percent":
      return formatPercent(value);
    case "currency":
      return formatCurrency(value);
    case "currency_precise":
      return formatCurrencyPrecise(value);
    case "count":
      return formatCompactNumber(value);
    case "rate":
      return formatRate(value);
    case "index":
    default:
      return formatIndex(value);
  }
}
