/* ==========================================================================
   Fake data generators — deterministic-ish, browser-friendly.
   All randomness uses Math.random for portability.
   ========================================================================== */

export type Address = {
  street: string;
  secondary?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export type Locale = {
  key: string;
  label: string;
  flag: string;
  generate: () => Address;
};

/* --------------------------- shared helpers --------------------------- */

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomZip(zips: readonly string[]) {
  return pick(zips);
}

/* ------------------------------ US ------------------------------ */

const US_STREET_NAMES = [
  "Oak", "Maple", "Cedar", "Pine", "Elm", "Birch", "Willow", "Cherry",
  "Apple", "River", "Lake", "Hill", "Valley", "Sunset", "Main", "Market",
  "Church", "School", "Park", "Washington", "Lincoln", "Franklin", "Adams",
  "Jefferson", "Madison", "Harrison", "Jackson", "Redwood", "Highland",
] as const;

const US_STREET_TYPES = [
  "St", "Ave", "Blvd", "Rd", "Ln", "Dr", "Ct", "Pl", "Way", "Ter", "Pkwy",
] as const;

const US_CITIES = [
  "Springfield", "Riverside", "Franklin", "Greenville", "Bristol", "Clinton",
  "Fairview", "Salem", "Madison", "Georgetown", "Arlington", "Ashland",
  "Burlington", "Manchester", "Rochester", "Auburn", "Cedar Rapids",
  "Everett", "Jefferson City", "Kingston",
] as const;

const US_STATES = [
  "California", "Texas", "Florida", "New York", "Pennsylvania", "Illinois",
  "Ohio", "Georgia", "North Carolina", "Michigan", "Washington", "Arizona",
  "Colorado", "Oregon", "Tennessee", "Virginia", "New Jersey", "Oklahoma",
] as const;

const US_ZIPS = ["10001", "90001", "60601", "77001", "33101", "02108", "48201", "20001"];

function generateUsAddress(): Address {
  const state = pick(US_STATES);
  const secondary = Math.random() < 0.4 ? `Apt ${randInt(1, 200)}` : undefined;

  return {
    street: `${randInt(100, 9999)} ${pick(US_STREET_NAMES)} ${pick(US_STREET_TYPES)}`,
    secondary,
    city: pick(US_CITIES),
    state,
    zip: randomZip(US_ZIPS),
    country: "United States",
  };
}

/* ------------------------------ GB ------------------------------ */

const GB_STREET_NAMES = [
  "Church", "Station", "Market", "High", "Victoria", "Albert", "Queen",
  "King", "Mill", "Oak", "Park", "Station", "Main", "London", "Bridge",
] as const;

const GB_CITIES = [
  "London", "Birmingham", "Manchester", "Leeds", "Glasgow", "Liverpool",
  "Bristol", "Sheffield", "Cardiff", "Edinburgh", "Nottingham", "Newcastle",
] as const;

const GB_POSTCODES = [
  "SW1A 1AA", "EC1A 1BB", "M1 1AE", "LS1 3EX", "G1 1XW", "B1 1AA",
  "BS1 4DG", "S1 2HE", "CF10 1AL", "EH1 1YZ", "NG1 2AA", "NE1 1SE",
] as const;

function generateGbAddress(): Address {
  return {
    street: `${randInt(1, 240)} ${pick(GB_STREET_NAMES)} ${pick([...GB_STREET_NAMES].filter((s) => s.length < 9) as readonly string[])}`,
    city: pick(GB_CITIES),
    state: "",
    zip: pick(GB_POSTCODES),
    country: "United Kingdom",
  };
}

/* ------------------------------ AU ------------------------------ */

const AU_SUBURBS = [
  "Bondi", "Fitzroy", "Surry Hills", "Northcote", "Manly", "Newtown",
  "Paddington", "Richmond", "Southbank", "Toorak", "Croydon", "Randwick",
] as const;

const AU_STREETS = [
  "George", "Elizabeth", "Collins", "Swanston", "Chapel", "Burke",
  "Flinders", "King", "William", "Queen", "Victoria", "Wattle",
] as const;

const AU_STATES = [
  { name: "New South Wales", abbrev: "NSW" },
  { name: "Victoria", abbrev: "VIC" },
  { name: "Queensland", abbrev: "QLD" },
  { name: "Western Australia", abbrev: "WA" },
  { name: "South Australia", abbrev: "SA" },
  { name: "Tasmania", abbrev: "TAS" },
] as const;

const AU_POSTCODES = ["2000", "3000", "4000", "5000", "6000", "7000", "3010", "2042"];

function generateAuAddress(): Address {
  const state = pick(AU_STATES);
  const secondary = Math.random() < 0.35 ? `Unit ${randInt(1, 60)}` : undefined;

  return {
    street: `${randInt(1, 300)} ${pick(AU_STREETS)} ${pick(["St", "Rd", "Ave", "Crescent", "Parade", "Place"] as const)}`,
    secondary,
    city: pick(AU_SUBURBS),
    state: state.name,
    zip: randomZip(AU_POSTCODES),
    country: "Australia",
  };
}

/* ------------------------------ CA ------------------------------ */

const CA_STREETS = [
  "Main", "King", "Queen", "Bloor", "Yonge", "Bay", "Lakeshore", "Front",
  "Dundas", "College", "Spadina", "Harbour", "Granville", "Robson",
] as const;

const CA_CITIES = [
  "Toronto", "Vancouver", "Montreal", "Calgary", "Edmonton", "Ottawa",
  "Winnipeg", "Quebec City", "Halifax", "Victoria",
] as const;

const CA_PROVINCES = [
  "Ontario", "British Columbia", "Quebec", "Alberta", "Manitoba", "Nova Scotia",
] as const;

const CA_POSTCODES = [
  "M5V 2T6", "V6B 0M8", "H2X 1Y4", "T2P 1J5", "T5J 1B4", "K1N 5R7",
  "R3B 1C3", "G1R 2A5", "B3H 3J2", "V8W 1X2",
] as const;

function generateCaAddress(): Address {
  return {
    street: `${randInt(1, 999)} ${pick(CA_STREETS)} ${pick(["St", "Ave", "Rd", "Blvd", "Way", "Crescent"] as const)}`,
    city: pick(CA_CITIES),
    state: pick(CA_PROVINCES),
    zip: pick(CA_POSTCODES),
    country: "Canada",
  };
}

/* ------------------------------ DE ------------------------------ */

const DE_STREET_NAMES = [
  "Hauptstraße", "Bahnhofstraße", "Goethestraße", "Schillerstraße",
  "Berliner", "Linden", "Schulstraße", "Kirchstraße", "Gartenstraße",
  "Rathaus", "Markt", "Mühlen", "Bahnhof",
] as const;

const DE_CITIES = [
  "Berlin", "Hamburg", "München", "Köln", "Frankfurt am Main", "Stuttgart",
  "Düsseldorf", "Leipzig", "Dresden", "Dortmund", "Hannover", "Bremen",
] as const;

const DE_POSTCODES = ["10115", "20095", "80331", "50667", "60311", "70173", "40213", "04109"];

function generateDeAddress(): Address {
  return {
    street: `${pick(DE_STREET_NAMES)} ${randInt(1, 200)}`,
    city: pick(DE_CITIES),
    state: "",
    zip: pick(DE_POSTCODES),
    country: "Germany",
  };
}

/* ------------------------------ FR ------------------------------ */

const FR_STREET_NAMES = [
  "Rue de la Paix", "Rue Victor Hugo", "Rue des Lilas", "Avenue des Champs",
  "Rue du Faubourg", "Boulevard Saint-Michel", "Rue de Rivoli", "Place de la République",
  "Rue Nationale", "Rue de la République", "Avenue Jean Jaurès", "Rue de l'Église",
] as const;

const FR_CITIES = [
  "Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Strasbourg",
  "Bordeaux", "Lille", "Rennes",
] as const;

const FR_POSTCODES = ["75001", "69002", "13001", "31000", "06000", "44000", "67000", "33000"];

function generateFrAddress(): Address {
  return {
    street: `${randInt(1, 200)} ${pick(FR_STREET_NAMES)}`,
    city: pick(FR_CITIES),
    state: "",
    zip: pick(FR_POSTCODES),
    country: "France",
  };
}

/* --------------------------- Locale list --------------------------- */

export const locales: Locale[] = [
  { key: "US", label: "United States", flag: "🇺🇸", generate: generateUsAddress },
  { key: "GB", label: "United Kingdom", flag: "🇬🇧", generate: generateGbAddress },
  { key: "AU", label: "Australia", flag: "🇦🇺", generate: generateAuAddress },
  { key: "CA", label: "Canada", flag: "🇨🇦", generate: generateCaAddress },
  { key: "DE", label: "Germany", flag: "🇩🇪", generate: generateDeAddress },
  { key: "FR", label: "France", flag: "🇫🇷", generate: generateFrAddress },
];

/* --------------------------- Formatting --------------------------- */

export function formatAddress(address: Address, style: "single" | "multi"): string {
  const lines = [address.street];
  if (address.secondary) lines.push(address.secondary);
  lines.push(`${address.city}${address.state ? `, ${address.state}` : ""} ${address.zip}`);
  lines.push(address.country);

  return style === "multi" ? lines.join("\n") : lines.join(", ");
}