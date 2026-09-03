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
  generate: (zipcode?: string) => Address;
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

function generateUsAddress(zipcode?: string): Address {
  const state = pick(US_STATES);
  const secondary = Math.random() < 0.4 ? `Apt ${randInt(1, 200)}` : undefined;

  return {
    street: `${randInt(100, 9999)} ${pick(US_STREET_NAMES)} ${pick(US_STREET_TYPES)}`,
    secondary,
    city: pick(US_CITIES),
    state,
    zip: zipcode || randomZip(US_ZIPS),
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

function generateGbAddress(zipcode?: string): Address {
  return {
    street: `${randInt(1, 240)} ${pick(GB_STREET_NAMES)} ${pick([...GB_STREET_NAMES].filter((s) => s.length < 9) as readonly string[])}`,
    city: pick(GB_CITIES),
    state: "",
    zip: zipcode || pick(GB_POSTCODES),
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

function generateAuAddress(zipcode?: string): Address {
  const state = pick(AU_STATES);
  const secondary = Math.random() < 0.35 ? `Unit ${randInt(1, 60)}` : undefined;

  return {
    street: `${randInt(1, 300)} ${pick(AU_STREETS)} ${pick(["St", "Rd", "Ave", "Crescent", "Parade", "Place"] as const)}`,
    secondary,
    city: pick(AU_SUBURBS),
    state: state.name,
    zip: zipcode || randomZip(AU_POSTCODES),
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

function generateCaAddress(zipcode?: string): Address {
  return {
    street: `${randInt(1, 999)} ${pick(CA_STREETS)} ${pick(["St", "Ave", "Rd", "Blvd", "Way", "Crescent"] as const)}`,
    city: pick(CA_CITIES),
    state: pick(CA_PROVINCES),
    zip: zipcode || pick(CA_POSTCODES),
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

function generateDeAddress(zipcode?: string): Address {
  return {
    street: `${pick(DE_STREET_NAMES)} ${randInt(1, 200)}`,
    city: pick(DE_CITIES),
    state: "",
    zip: zipcode || pick(DE_POSTCODES),
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

function generateFrAddress(zipcode?: string): Address {
  return {
    street: `${randInt(1, 200)} ${pick(FR_STREET_NAMES)}`,
    city: pick(FR_CITIES),
    state: "",
    zip: zipcode || pick(FR_POSTCODES),
    country: "France",
  };
}

/* ------------------------------ JP ------------------------------ */

const JP_PREFECTURES = [
  "Tokyo", "Osaka", "Kanagawa", "Aichi", "Hyogo", "Hokkaido", "Fukuoka",
  "Saitama", "Chiba", "Shizuoka",
] as const;

const JP_CITIES = [
  "Shibuya", "Shinjuku", "Ginza", "Roppongi", "Akihabara", "Ikebukuro",
  "Umeda", "Namba", "Tennoji", "Nakamura", "Sakae", "Fushimi",
  "Sapporo", "Hakata", "Oita", "Naha",
] as const;

const JP_STREET_NAMES = [
  "Dori", "Cho", "Machi", "Koji", "Zaka", "Bashi", "Toori", "Suji",
] as const;

const JP_POSTCODES = [
  "150-0001", "160-0001", "104-0061", "106-0032", "101-0021", "170-0013",
  "530-0001", "542-0076", "543-0001", "460-0001", "460-0008", "600-8001",
  "060-0001", "810-0001", "870-0001", "900-0001",
] as const;

function generateJpAddress(zipcode?: string): Address {
  return {
    street: `${pick(JP_CITIES)}-${randInt(1, 5)}-${randInt(1, 20)}-${randInt(1, 30)}`,
    city: pick(JP_CITIES),
    state: pick(JP_PREFECTURES),
    zip: zipcode || pick(JP_POSTCODES),
    country: "Japan",
  };
}

/* ------------------------------ BR ------------------------------ */

const BR_STREET_NAMES = [
  "Rua das Flores", "Avenida Paulista", "Rua Augusta", "Rua Oscar Freire",
  "Avenida Brasil", "Rua da Consolação", "Avenida Faria Lima", "Rua Haddock Lobo",
  "Rua Bela Cintra", "Alameda Santos", "Rua Pamplona", "Avenida Rebouças",
] as const;

const BR_CITIES = [
  "São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza",
  "Belo Horizonte", "Manaus", "Curitiba", "Recife", "Porto Alegre",
] as const;

const BR_STATES = [
  "São Paulo", "Rio de Janeiro", "Distrito Federal", "Bahia", "Ceará",
  "Minas Gerais", "Amazonas", "Paraná", "Pernambuco", "Rio Grande do Sul",
] as const;

const BR_POSTCODES = [
  "01310-000", "20010-000", "70000-000", "40010-000", "60010-000",
  "30110-000", "69010-000", "80010-000", "50010-000", "90010-000",
] as const;

function generateBrAddress(zipcode?: string): Address {
  return {
    street: `${pick(BR_STREET_NAMES)}, ${randInt(1, 500)}`,
    city: pick(BR_CITIES),
    state: pick(BR_STATES),
    zip: zipcode || pick(BR_POSTCODES),
    country: "Brazil",
  };
}

/* ------------------------------ IN ------------------------------ */

const IN_STREET_NAMES = [
  "MG Road", "Brigade Road", "Commercial Street", "Residency Road",
  "Church Street", "Cunningham Road", "Lavelle Road", "Vittal Mallya Road",
  "Nehru Road", "Gandhi Road", "Park Street", "Marine Drive",
] as const;

const IN_CITIES = [
  "Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Kolkata",
  "Pune", "Ahmedabad", "Jaipur", "Lucknow",
] as const;

const IN_STATES = [
  "Karnataka", "Maharashtra", "Delhi", "Telangana", "Tamil Nadu",
  "West Bengal", "Maharashtra", "Gujarat", "Rajasthan", "Uttar Pradesh",
] as const;

const IN_POSTCODES = [
  "560001", "400001", "110001", "500001", "600001",
  "700001", "411001", "380001", "302001", "226001",
] as const;

function generateInAddress(zipcode?: string): Address {
  return {
    street: `${randInt(1, 500)}, ${pick(IN_STREET_NAMES)}`,
    city: pick(IN_CITIES),
    state: pick(IN_STATES),
    zip: zipcode || pick(IN_POSTCODES),
    country: "India",
  };
}

/* ------------------------------ MX ------------------------------ */

const MX_STREET_NAMES = [
  "Avenida de la Reforma", "Calle de la Palma", "Calle de Donceles",
  "Avenida Insurgentes", "Calle de Madero", "Calle de Tacuba",
  "Avenida Universidad", "Calle de Moneda", "Calle de Gante",
  "Avenida Chapultepec", "Calle de Morelos", "Calle de Independencia",
] as const;

const MX_CITIES = [
  "Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Tijuana",
  "León", "Juárez", "Torreón", "Querétaro", "San Luis Potosí",
] as const;

const MX_STATES = [
  "Ciudad de México", "Jalisco", "Nuevo León", "Puebla", "Baja California",
  "Guanajuato", "Chihuahua", "Coahuila", "Querétaro", "San Luis Potosí",
] as const;

const MX_POSTCODES = [
  "06000", "44100", "64000", "72000", "22000",
  "37000", "32000", "27000", "76000", "78000",
] as const;

function generateMxAddress(zipcode?: string): Address {
  return {
    street: `${pick(MX_STREET_NAMES)} ${randInt(1, 500)}`,
    city: pick(MX_CITIES),
    state: pick(MX_STATES),
    zip: zipcode || pick(MX_POSTCODES),
    country: "Mexico",
  };
}

/* ------------------------------ IT ------------------------------ */

const IT_STREET_NAMES = [
  "Via Roma", "Via Milano", "Via Torino", "Via Napoli", "Via Venezia",
  "Via Firenze", "Via Bologna", "Via Genova", "Via Palermo", "Via Catania",
  "Corso Italia", "Corso Vittorio Emanuele", "Corso Buenos Aires",
] as const;

const IT_CITIES = [
  "Roma", "Milano", "Napoli", "Torino", "Palermo", "Genova", "Bologna",
  "Firenze", "Bari", "Catania", "Venezia", "Verona", "Messina",
] as const;

const IT_PROVINCES = [
  "RM", "MI", "NA", "TO", "PA", "GE", "BO", "FI", "BA", "CT", "VE", "VR", "ME",
] as const;

const IT_POSTCODES = [
  "00100", "20100", "80100", "10100", "90100", "16100", "40100",
  "50100", "70100", "95100", "30100", "37100", "98100",
] as const;

function generateItAddress(zipcode?: string): Address {
  return {
    street: `${pick(IT_STREET_NAMES)} ${randInt(1, 200)}`,
    city: pick(IT_CITIES),
    state: pick(IT_PROVINCES),
    zip: zipcode || pick(IT_POSTCODES),
    country: "Italy",
  };
}

/* ------------------------------ ES ------------------------------ */

const ES_STREET_NAMES = [
  "Calle Mayor", "Calle de Alcalá", "Gran Vía", "Paseo de la Castellana",
  "Calle de Serrano", "Calle de Fuencarral", "Calle de Preciados", "Calle del Carmen",
  "Avenida Diagonal", "Calle de Balmes", "Paseo de Gracia", "Calle de Pelai",
] as const;

const ES_CITIES = [
  "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Málaga",
  "Murcia", "Palma", "Las Palmas", "Bilbao", "Alicante", "Córdoba",
] as const;

const ES_PROVINCES = [
  "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Málaga",
  "Murcia", "Baleares", "Las Palmas", "Bizkaia", "Alicante", "Córdoba",
] as const;

const ES_POSTCODES = [
  "28001", "08001", "46001", "41001", "50001", "29001",
  "30001", "07001", "35001", "48001", "03001", "14001",
] as const;

function generateEsAddress(zipcode?: string): Address {
  return {
    street: `${pick(ES_STREET_NAMES)} ${randInt(1, 200)}`,
    city: pick(ES_CITIES),
    state: pick(ES_PROVINCES),
    zip: zipcode || pick(ES_POSTCODES),
    country: "Spain",
  };
}

/* ------------------------------ NL ------------------------------ */

const NL_STREET_NAMES = [
  "Damrak", "Kalverstraat", "Leidsestraat", "Haarlemmerstraat", "Spui",
  "Nieuwendijk", "Rokin", "Herengracht", "Keizersgracht", "Prinsengracht",
] as const;

const NL_CITIES = [
  "Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven",
  "Tilburg", "Groningen", "Almere", "Breda", "Nijmegen",
] as const;

const NL_PROVINCES = [
  "Noord-Holland", "Zuid-Holland", "Zuid-Holland", "Utrecht", "Noord-Brabant",
  "Noord-Brabant", "Groningen", "Flevoland", "Noord-Brabant", "Gelderland",
] as const;

const NL_POSTCODES = [
  "1012", "3011", "2511", "3511", "5611",
  "5011", "9711", "1311", "4811", "6511",
] as const;

function generateNlAddress(zipcode?: string): Address {
  return {
    street: `${pick(NL_STREET_NAMES)} ${randInt(1, 200)}`,
    city: pick(NL_CITIES),
    state: pick(NL_PROVINCES),
    zip: zipcode || pick(NL_POSTCODES),
    country: "Netherlands",
  };
}

/* ------------------------------ KR ------------------------------ */

const KR_CITIES = [
  "Seoul", "Busan", "Daegu", "Incheon", "Gwangju", "Daejeon", "Ulsan",
  "Suwon", "Changwon", "Goyang", "Yongin", "Seongnam", "Bucheon",
] as const;

const KR_DISTRICTS = [
  "Gangnam-gu", "Jung-gu", "Mapo-gu", "Seocho-gu", "Songpa-gu", "Yongsan-gu",
  "Busanjin-gu", "Dalseo-gu", "Nam-gu", "Seo-gu", "Buk-gu", "Jung-gu",
  "Nam-gu", "Jung-gu", "Wonmi-gu",
] as const;

const KR_STREET_NAMES = [
  "Teheran-ro", "Gangnam-daero", "Sejong-daero", "Eulji-ro", "Toegye-ro",
  "Jongno", "Myeongdong-gil", "Hongdae-ro", "Itaewon-ro", "Gangnam-ro",
] as const;

const KR_POSTCODES = [
  "06234", "04524", "04157", "06625", "05554", "04376",
  "47281", "42672", "61753", "22533", "41935", "35242",
  "61184", "13524", "14547",
] as const;

function generateKrAddress(zipcode?: string): Address {
  return {
    street: `${pick(KR_STREET_NAMES)} ${randInt(1, 100)}-${randInt(1, 50)}`,
    city: pick(KR_CITIES),
    state: pick(KR_DISTRICTS),
    zip: zipcode || pick(KR_POSTCODES),
    country: "South Korea",
  };
}

/* ------------------------------ SG ------------------------------ */

const SG_STREET_NAMES = [
  "Orchard Road", "Marina Bay", "Raffles Place", "Shenton Way", "Robinson Road",
  "Chinatown", "Little India", "Kampong Glam", "Sentosa", "Holland Village",
  "Tiong Bahru", "Clarke Quay", "Boat Quay", "Robertson Quay",
] as const;

const SG_DISTRICTS = [
  "Central", "Marina", "Downtown", "Orchard", "Newton", "River Valley",
  "Outram", "Bukit Merah", "Kallang", "Geylang", "Bedok", "Tampines",
] as const;

const SG_POSTCODES = [
  "238872", "018983", "048623", "079118", "068896",
  "059573", "208533", "199438", "398174", "389180",
  "468912", "529234", "498317", "238260",
] as const;

function generateSgAddress(zipcode?: string): Address {
  return {
    street: `${randInt(1, 200)} ${pick(SG_STREET_NAMES)}`,
    city: "Singapore",
    state: pick(SG_DISTRICTS),
    zip: zipcode || pick(SG_POSTCODES),
    country: "Singapore",
  };
}

/* --------------------------- Locale list --------------------------- */

export const locales: Locale[] = [
  { key: "US", label: "United States", flag: "🇺🇸", generate: generateUsAddress },
  { key: "GB", label: "United Kingdom", flag: "🇬🇧", generate: generateGbAddress },
  { key: "IN", label: "India", flag: "🇮🇳", generate: generateInAddress },
  { key: "AU", label: "Australia", flag: "🇦🇺", generate: generateAuAddress },
  { key: "CA", label: "Canada", flag: "🇨🇦", generate: generateCaAddress },
  { key: "DE", label: "Germany", flag: "🇩🇪", generate: generateDeAddress },
  { key: "FR", label: "France", flag: "🇫🇷", generate: generateFrAddress },
  { key: "JP", label: "Japan", flag: "🇯🇵", generate: generateJpAddress },
  { key: "BR", label: "Brazil", flag: "🇧🇷", generate: generateBrAddress },
  { key: "MX", label: "Mexico", flag: "🇲🇽", generate: generateMxAddress },
  { key: "IT", label: "Italy", flag: "🇮🇹", generate: generateItAddress },
  { key: "ES", label: "Spain", flag: "🇪🇸", generate: generateEsAddress },
  { key: "NL", label: "Netherlands", flag: "🇳🇱", generate: generateNlAddress },
  { key: "KR", label: "South Korea", flag: "🇰🇷", generate: generateKrAddress },
  { key: "SG", label: "Singapore", flag: "🇸🇬", generate: generateSgAddress },
];

/* --------------------------- Formatting --------------------------- */

export function formatAddress(address: Address, style: "single" | "multi"): string {
  const lines = [address.street];
  if (address.secondary) lines.push(address.secondary);
  lines.push(`${address.city}${address.state ? `, ${address.state}` : ""} ${address.zip}`);
  lines.push(address.country);

  return style === "multi" ? lines.join("\n") : lines.join(", ");
}

/* --------------------------- Fake user --------------------------- */

export type FakeUser = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  username: string;
  avatar: string;
  dob: string;
  gender: "Male" | "Female";
};

const FIRST_NAMES = [
  "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
  "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph",
  "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Lisa",
  "Daniel", "Nancy", "Matthew", "Betty", "Anthony", "Margaret", "Mark",
  "Sandra", "Donald", "Ashley", "Steven", "Kimberly", "Paul", "Emily",
  "Andrew", "Donna", "Joshua", "Michelle", "Kenneth", "Carol", "Kevin",
  "Amanda", "Brian", "Dorothy", "George", "Melissa", "Timothy", "Deborah",
  "Ronald", "Stephanie", "Edward", "Rebecca", "Jason", "Sharon", "Jeffrey",
  "Laura", "Ryan", "Cynthia", "Jacob", "Kathleen", "Gary", "Amy", "Nicholas",
  "Angela", "Eric", "Shirley", "Jonathan", "Anna", "Stephen", "Brenda",
  "Larry", "Pamela", "Justin", "Emma", "Scott", "Nicole", "Brandon",
  "Helen", "Benjamin", "Samantha", "Samuel", "Katherine", "Gregory", "Christine",
  "Alexander", "Debra", "Patrick", "Rachel", "Jack", "Carolyn", "Dennis",
  "Janet", "Jerry", "Catherine", "Tyler", "Maria", "Aaron", "Heather",
] as const;

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
  "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
  "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark",
  "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King",
  "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green",
  "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
  "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz",
  "Parker", "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris",
  "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan",
  "Cooper", "Peterson", "Bailey", "Reed", "Kelly", "Howard", "Ramos",
  "Kim", "Cox", "Ward", "Richardson", "Watson", "Brooks", "Chavez",
  "Wood", "James", "Bennett", "Gray", "Mendoza", "Ruiz", "Hughes",
  "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers", "Long",
  "Ross", "Foster", "Jimenez", "Powell",
] as const;

const EMAIL_DOMAINS = [
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com",
  "protonmail.com", "mail.com", "zoho.com", "aol.com", "gmx.com",
] as const;

const USERNAME_SUFFIXES = [
  "dev", "coder", "pro", "fan", "lover", "guru", "expert", "wiz",
  "master", "genius", "star", "fox", "wolf", "tiger", "eagle", "hawk",
  "king", "queen", "ace", "lion", "bear", "panda", "ninja", "hero",
] as const;

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateFormat(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function generateUser(): FakeUser {
  const gender: "Male" | "Female" = Math.random() < 0.5 ? "Male" : "Female";
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  const usernameSuffix = pick(USERNAME_SUFFIXES);
  const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${randomInt(1, 999)}_${usernameSuffix}`;
  const domain = pick(EMAIL_DOMAINS);
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 999)}@${domain}`;

  const countryCode = pick(["+1", "+44", "+91", "+61", "+1", "+49", "+33", "+81", "+55", "+52", "+39", "+34", "+31", "+82", "+65"] as const);
  const phone = `${countryCode} ${randomInt(200, 999)}-${randomInt(100, 999)}-${randomInt(1000, 9999)}`;

  const now = new Date();
  const age = randomInt(18, 70);
  const dobDate = new Date(now.getFullYear() - age, randomInt(0, 11), randomInt(1, 28));

  const avatarSeed = `${firstName}-${lastName}-${randomInt(1, 999)}`;
  const avatar = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(avatarSeed)}`;

  return {
    firstName,
    lastName,
    email,
    phone,
    username,
    avatar,
    dob: randomDateFormat(dobDate),
    gender,
  };
}