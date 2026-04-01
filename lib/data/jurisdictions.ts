export type JurisdictionSeed = {
  slug: string;
  name: string;
  abbr: string;
  fips: string;
  isDc?: boolean;
};

export const JURISDICTIONS: JurisdictionSeed[] = [
  { slug: "alabama", name: "Alabama", abbr: "AL", fips: "01" },
  { slug: "alaska", name: "Alaska", abbr: "AK", fips: "02" },
  { slug: "arizona", name: "Arizona", abbr: "AZ", fips: "04" },
  { slug: "arkansas", name: "Arkansas", abbr: "AR", fips: "05" },
  { slug: "california", name: "California", abbr: "CA", fips: "06" },
  { slug: "colorado", name: "Colorado", abbr: "CO", fips: "08" },
  { slug: "connecticut", name: "Connecticut", abbr: "CT", fips: "09" },
  { slug: "delaware", name: "Delaware", abbr: "DE", fips: "10" },
  { slug: "district-of-columbia", name: "District of Columbia", abbr: "DC", fips: "11", isDc: true },
  { slug: "florida", name: "Florida", abbr: "FL", fips: "12" },
  { slug: "georgia", name: "Georgia", abbr: "GA", fips: "13" },
  { slug: "hawaii", name: "Hawaii", abbr: "HI", fips: "15" },
  { slug: "idaho", name: "Idaho", abbr: "ID", fips: "16" },
  { slug: "illinois", name: "Illinois", abbr: "IL", fips: "17" },
  { slug: "indiana", name: "Indiana", abbr: "IN", fips: "18" },
  { slug: "iowa", name: "Iowa", abbr: "IA", fips: "19" },
  { slug: "kansas", name: "Kansas", abbr: "KS", fips: "20" },
  { slug: "kentucky", name: "Kentucky", abbr: "KY", fips: "21" },
  { slug: "louisiana", name: "Louisiana", abbr: "LA", fips: "22" },
  { slug: "maine", name: "Maine", abbr: "ME", fips: "23" },
  { slug: "maryland", name: "Maryland", abbr: "MD", fips: "24" },
  { slug: "massachusetts", name: "Massachusetts", abbr: "MA", fips: "25" },
  { slug: "michigan", name: "Michigan", abbr: "MI", fips: "26" },
  { slug: "minnesota", name: "Minnesota", abbr: "MN", fips: "27" },
  { slug: "mississippi", name: "Mississippi", abbr: "MS", fips: "28" },
  { slug: "missouri", name: "Missouri", abbr: "MO", fips: "29" },
  { slug: "montana", name: "Montana", abbr: "MT", fips: "30" },
  { slug: "nebraska", name: "Nebraska", abbr: "NE", fips: "31" },
  { slug: "nevada", name: "Nevada", abbr: "NV", fips: "32" },
  { slug: "new-hampshire", name: "New Hampshire", abbr: "NH", fips: "33" },
  { slug: "new-jersey", name: "New Jersey", abbr: "NJ", fips: "34" },
  { slug: "new-mexico", name: "New Mexico", abbr: "NM", fips: "35" },
  { slug: "new-york", name: "New York", abbr: "NY", fips: "36" },
  { slug: "north-carolina", name: "North Carolina", abbr: "NC", fips: "37" },
  { slug: "north-dakota", name: "North Dakota", abbr: "ND", fips: "38" },
  { slug: "ohio", name: "Ohio", abbr: "OH", fips: "39" },
  { slug: "oklahoma", name: "Oklahoma", abbr: "OK", fips: "40" },
  { slug: "oregon", name: "Oregon", abbr: "OR", fips: "41" },
  { slug: "pennsylvania", name: "Pennsylvania", abbr: "PA", fips: "42" },
  { slug: "rhode-island", name: "Rhode Island", abbr: "RI", fips: "44" },
  { slug: "south-carolina", name: "South Carolina", abbr: "SC", fips: "45" },
  { slug: "south-dakota", name: "South Dakota", abbr: "SD", fips: "46" },
  { slug: "tennessee", name: "Tennessee", abbr: "TN", fips: "47" },
  { slug: "texas", name: "Texas", abbr: "TX", fips: "48" },
  { slug: "utah", name: "Utah", abbr: "UT", fips: "49" },
  { slug: "vermont", name: "Vermont", abbr: "VT", fips: "50" },
  { slug: "virginia", name: "Virginia", abbr: "VA", fips: "51" },
  { slug: "washington", name: "Washington", abbr: "WA", fips: "53" },
  { slug: "west-virginia", name: "West Virginia", abbr: "WV", fips: "54" },
  { slug: "wisconsin", name: "Wisconsin", abbr: "WI", fips: "55" },
  { slug: "wyoming", name: "Wyoming", abbr: "WY", fips: "56" }
];

export const JURISDICTION_BY_ABBR = new Map(
  JURISDICTIONS.map((jurisdiction) => [jurisdiction.abbr, jurisdiction])
);

export const JURISDICTION_BY_FIPS = new Map(
  JURISDICTIONS.map((jurisdiction) => [jurisdiction.fips, jurisdiction])
);
