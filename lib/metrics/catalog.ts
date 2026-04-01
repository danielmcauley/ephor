export type MetricCadence = "MONTHLY" | "QUARTERLY" | "ANNUAL";
export type BetterDirection = "HIGHER" | "LOWER";
export type MetricCategory = "Economy" | "Growth" | "People & Affordability";

export type MetricCatalogEntry = {
  id: string;
  label: string;
  category: MetricCategory;
  sourceName: string;
  sourceUrl: string;
  cadence: MetricCadence;
  betterDirection: BetterDirection;
  unit: "percent" | "index" | "currency" | "currency_precise" | "count" | "rate";
  description: string;
  caveats?: string;
  methodology: string;
  defaultMetric?: boolean;
};

export const METRIC_CATALOG: MetricCatalogEntry[] = [
  {
    id: "unemployment_rate",
    label: "Unemployment rate",
    category: "Economy",
    sourceName: "BLS Local Area Unemployment Statistics",
    sourceUrl: "https://www.bls.gov/lau/",
    cadence: "MONTHLY",
    betterDirection: "LOWER",
    unit: "percent",
    description: "Seasonally adjusted unemployment rate by state.",
    caveats: "State-level unemployment estimates are revised and may lag the reference month.",
    methodology: "BLS LAUS statewide seasonally adjusted unemployment rate."
  },
  {
    id: "payroll_growth",
    label: "Payroll job growth",
    category: "Economy",
    sourceName: "BLS State & Area Current Employment Statistics",
    sourceUrl: "https://www.bls.gov/sae/",
    cadence: "MONTHLY",
    betterDirection: "HIGHER",
    unit: "percent",
    description: "12-month percent change in total nonfarm payroll employment.",
    caveats: "Computed from raw employment levels and benchmarked monthly estimates.",
    methodology: "Percent change of statewide total nonfarm all employees versus the same month one year earlier.",
    defaultMetric: true
  },
  {
    id: "real_gdp_growth",
    label: "Real GDP growth",
    category: "Growth",
    sourceName: "Bureau of Economic Analysis GDP by State",
    sourceUrl: "https://www.bea.gov/data/gdp/gdp-state",
    cadence: "QUARTERLY",
    betterDirection: "HIGHER",
    unit: "percent",
    description: "Year-over-year growth in real GDP by state.",
    caveats: "BEA quarterly releases are revised as source data updates.",
    methodology: "Year-over-year percent change using BEA real GDP by state."
  },
  {
    id: "population_growth",
    label: "Population growth",
    category: "Growth",
    sourceName: "U.S. Census Population Estimates Program",
    sourceUrl: "https://www.census.gov/programs-surveys/popest.html",
    cadence: "ANNUAL",
    betterDirection: "HIGHER",
    unit: "percent",
    description: "Year-over-year resident population growth.",
    caveats: "The latest vintage revises prior years back to the 2020 base.",
    methodology: "July 1 resident population estimate percent change from the prior year."
  },
  {
    id: "median_household_income",
    label: "Median household income",
    category: "People & Affordability",
    sourceName: "U.S. Census ACS 1-year",
    sourceUrl: "https://www.census.gov/programs-surveys/acs",
    cadence: "ANNUAL",
    betterDirection: "HIGHER",
    unit: "currency",
    description: "Median household income in inflation-adjusted dollars.",
    caveats: "Available for states and DC; subject to sampling error.",
    methodology: "ACS 1-year profile estimate for median household income."
  },
  {
    id: "poverty_rate",
    label: "Poverty rate",
    category: "People & Affordability",
    sourceName: "U.S. Census ACS 1-year",
    sourceUrl: "https://www.census.gov/programs-surveys/acs",
    cadence: "ANNUAL",
    betterDirection: "LOWER",
    unit: "percent",
    description: "Percent of people below the federal poverty threshold.",
    caveats: "Available for states and DC; subject to sampling error.",
    methodology: "ACS 1-year subject table S1701 percent below poverty level."
  },
  {
    id: "bachelors_attainment",
    label: "Bachelor's attainment",
    category: "People & Affordability",
    sourceName: "U.S. Census ACS 1-year",
    sourceUrl: "https://www.census.gov/programs-surveys/acs",
    cadence: "ANNUAL",
    betterDirection: "HIGHER",
    unit: "percent",
    description: "Share of adults age 25+ with a bachelor's degree or higher.",
    caveats: "Available for states and DC; subject to sampling error.",
    methodology: "ACS 1-year subject table S1501 bachelor's degree or higher, population 25+."
  },
  {
    id: "cost_of_living_index",
    label: "Cost of living index",
    category: "People & Affordability",
    sourceName: "Bureau of Economic Analysis Regional Price Parities",
    sourceUrl: "https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area",
    cadence: "ANNUAL",
    betterDirection: "LOWER",
    unit: "index",
    description: "Regional Price Parity index where the U.S. average equals 100.",
    caveats: "Published annually and revised historically.",
    methodology: "BEA SARPP regional price parity index, U.S. average = 100."
  },
  {
    id: "gasoline_cost",
    label: "Gasoline cost",
    category: "People & Affordability",
    sourceName: "U.S. Energy Information Administration State Energy Data System",
    sourceUrl: "https://www.eia.gov/state/seds/seds-data-complete.php",
    cadence: "ANNUAL",
    betterDirection: "LOWER",
    unit: "currency_precise",
    description: "Average annual motor gasoline price for the transportation sector.",
    caveats: "EIA SEDS publishes this series in dollars per million Btu rather than pump price per gallon.",
    methodology: "EIA SEDS motor gasoline price series MGACD, latest annual state value."
  },
  {
    id: "homelessness_rate",
    label: "Homelessness rate",
    category: "People & Affordability",
    sourceName: "HUD Point-in-Time Estimates by State",
    sourceUrl: "https://www.huduser.gov/portal/datasets/ahar/2024-ahar-part-1-pit-estimates-of-homelessness-in-the-us.html",
    cadence: "ANNUAL",
    betterDirection: "LOWER",
    unit: "rate",
    description: "People experiencing homelessness per 10,000 residents.",
    caveats: "HUD PIT counts are one-night January counts and use Census population estimates as the denominator.",
    methodology: "HUD overall homelessness PIT counts divided by Census resident population estimates, expressed per 10,000 residents."
  },
  {
    id: "taxes_per_capita",
    label: "Taxes per capita",
    category: "People & Affordability",
    sourceName: "Census Annual Survey of State Government Tax Collections",
    sourceUrl: "https://www.census.gov/programs-surveys/stc.html",
    cadence: "ANNUAL",
    betterDirection: "LOWER",
    unit: "currency",
    description: "State tax collections per resident.",
    caveats: "Computed from state tax collections and Census population estimates for the same year.",
    methodology: "Census STC total taxes divided by Census resident population estimates."
  },
  {
    id: "state_spending_per_capita",
    label: "State spending per capita",
    category: "Economy",
    sourceName: "Census Annual Survey of State Government Finances",
    sourceUrl: "https://www.census.gov/programs-surveys/state.html",
    cadence: "ANNUAL",
    betterDirection: "HIGHER",
    unit: "currency",
    description: "State government direct expenditure per resident.",
    caveats: "This is a descriptive public-finance metric; higher values can reflect policy choices, cost structure, or service mix rather than simple performance.",
    methodology: "Census state government finance direct expenditure divided by Census resident population estimates."
  }
];

export const DEFAULT_METRIC_ID =
  METRIC_CATALOG.find((metric) => metric.defaultMetric)?.id ?? "payroll_growth";

export const METRIC_BY_ID = new Map(
  METRIC_CATALOG.map((metric) => [metric.id, metric])
);
