/**
 * Client-free "instant answers", like Google's calculator and unit converter.
 * Pure functions — no API calls, evaluated server-side per query.
 */

export interface InstantAnswer {
  kind: 'calculator' | 'unit' | 'time';
  /** Gray echo line, e.g. "5 kilometers =" or "Tokyo · Friday, Jul 4" */
  expression: string;
  /** Big line, e.g. "3.10686 miles", "16", or "3:42 PM" */
  result: string;
}

function formatNumber(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toLocaleString('en-US');
  const rounded = Number(n.toPrecision(12));
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 10 });
}

// ---------------------------------------------------------------------------
// Calculator: recursive-descent parser, never eval().
// ---------------------------------------------------------------------------

function evaluateArithmetic(input: string): number | null {
  const s = input
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/\s+/g, '');
  if (s.length === 0 || s.length > 100) return null;
  if (!/^[\d+\-*/^%().]+$/.test(s)) return null;
  if (!/\d/.test(s)) return null;
  // Must actually compute something (an operator beyond a leading sign)…
  if (!/[+*/^%]/.test(s) && !/\d-/.test(s)) return null;
  // …but a bare year range like "2024-2025" is a query, not arithmetic.
  if (/^\d{4}-\d{4}$/.test(s)) return null;

  let pos = 0;
  function parseExpr(): number {
    let value = parseTerm();
    while (s[pos] === '+' || s[pos] === '-') {
      const op = s[pos++];
      const rhs = parseTerm();
      value = op === '+' ? value + rhs : value - rhs;
    }
    return value;
  }
  function parseTerm(): number {
    let value = parseFactor();
    while (s[pos] === '*' || s[pos] === '/' || s[pos] === '%') {
      const op = s[pos++];
      const rhs = parseFactor();
      value = op === '*' ? value * rhs : op === '/' ? value / rhs : value % rhs;
    }
    return value;
  }
  function parseFactor(): number {
    const base = parseUnary();
    if (s[pos] === '^') {
      pos++;
      return base ** parseFactor(); // right-associative
    }
    return base;
  }
  function parseUnary(): number {
    if (s[pos] === '-') {
      pos++;
      return -parseUnary();
    }
    if (s[pos] === '+') pos++;
    return parsePrimary();
  }
  function parsePrimary(): number {
    if (s[pos] === '(') {
      pos++;
      const value = parseExpr();
      if (s[pos] !== ')') throw new Error('unbalanced');
      pos++;
      return value;
    }
    const m = /^\d+(?:\.\d+)?/.exec(s.slice(pos));
    if (!m) throw new Error('expected number');
    pos += m[0].length;
    return Number(m[0]);
  }

  try {
    const value = parseExpr();
    if (pos !== s.length || !Number.isFinite(value)) return null;
    return value;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Unit conversion: "5 km in miles", "72 f to c", "3 kg in lbs" …
// ---------------------------------------------------------------------------

type Category = 'length' | 'mass' | 'volume' | 'speed' | 'data' | 'temp';

interface Unit {
  cat: Category;
  /** Multiplier to the category's base unit (unused for temp). */
  factor: number;
  name: string;
  plural: string;
}

function unit(cat: Category, factor: number, name: string, plural?: string): Unit {
  return { cat, factor, name, plural: plural ?? `${name}s` };
}

const UNITS: Record<string, Unit> = {};
function alias(u: Unit, ...keys: string[]) {
  for (const k of keys) UNITS[k] = u;
}

// length (base: meter)
alias(unit('length', 0.001, 'millimeter'), 'mm', 'millimeter', 'millimeters');
alias(unit('length', 0.01, 'centimeter'), 'cm', 'centimeter', 'centimeters');
alias(unit('length', 1, 'meter'), 'm', 'meter', 'meters', 'metre', 'metres');
alias(unit('length', 1000, 'kilometer'), 'km', 'kilometer', 'kilometers', 'kilometre', 'kilometres');
alias(unit('length', 0.0254, 'inch', 'inches'), 'in', 'inch', 'inches');
alias(unit('length', 0.3048, 'foot', 'feet'), 'ft', 'foot', 'feet');
alias(unit('length', 0.9144, 'yard'), 'yd', 'yard', 'yards');
alias(unit('length', 1609.344, 'mile'), 'mi', 'mile', 'miles');
// mass (base: kilogram)
alias(unit('mass', 1e-6, 'milligram'), 'mg', 'milligram', 'milligrams');
alias(unit('mass', 0.001, 'gram'), 'g', 'gram', 'grams');
alias(unit('mass', 1, 'kilogram'), 'kg', 'kilogram', 'kilograms');
alias(unit('mass', 0.028349523125, 'ounce'), 'oz', 'ounce', 'ounces');
alias(unit('mass', 0.45359237, 'pound'), 'lb', 'lbs', 'pound', 'pounds');
alias(unit('mass', 6.35029318, 'stone', 'stone'), 'st', 'stone', 'stones');
alias(unit('mass', 1000, 'tonne'), 't', 'ton', 'tons', 'tonne', 'tonnes');
// volume (base: liter)
alias(unit('volume', 0.001, 'milliliter'), 'ml', 'milliliter', 'milliliters');
alias(unit('volume', 1, 'liter'), 'l', 'liter', 'liters', 'litre', 'litres');
alias(unit('volume', 3.785411784, 'gallon'), 'gal', 'gallon', 'gallons');
alias(unit('volume', 0.946352946, 'quart'), 'qt', 'quart', 'quarts');
alias(unit('volume', 0.473176473, 'pint'), 'pt', 'pint', 'pints');
alias(unit('volume', 0.2365882365, 'cup'), 'cup', 'cups');
alias(unit('volume', 0.01478676478, 'tablespoon'), 'tbsp', 'tablespoon', 'tablespoons');
alias(unit('volume', 0.00492892159, 'teaspoon'), 'tsp', 'teaspoon', 'teaspoons');
// speed (base: m/s)
alias(unit('speed', 0.2777777778, 'km/h', 'km/h'), 'km/h', 'kmh', 'kph');
alias(unit('speed', 0.44704, 'mph', 'mph'), 'mph');
alias(unit('speed', 1, 'm/s', 'm/s'), 'm/s');
alias(unit('speed', 0.5144444444, 'knot'), 'knot', 'knots', 'kn');
// data (base: byte, decimal prefixes like Google)
alias(unit('data', 1, 'byte'), 'byte', 'bytes');
alias(unit('data', 1e3, 'KB', 'KB'), 'kb');
alias(unit('data', 1e6, 'MB', 'MB'), 'mb');
alias(unit('data', 1e9, 'GB', 'GB'), 'gb');
alias(unit('data', 1e12, 'TB', 'TB'), 'tb');
alias(unit('data', 1024, 'KiB', 'KiB'), 'kib');
alias(unit('data', 1024 ** 2, 'MiB', 'MiB'), 'mib');
alias(unit('data', 1024 ** 3, 'GiB', 'GiB'), 'gib');
alias(unit('data', 1024 ** 4, 'TiB', 'TiB'), 'tib');
// temperature (special-cased)
alias(unit('temp', 1, 'Celsius', 'Celsius'), 'c', '°c', 'celsius', 'centigrade');
alias(unit('temp', 1, 'Fahrenheit', 'Fahrenheit'), 'f', '°f', 'fahrenheit');
alias(unit('temp', 1, 'Kelvin', 'Kelvin'), 'k', 'kelvin');

function convertTemp(value: number, from: string, to: string): number {
  const c =
    from === 'Celsius' ? value : from === 'Fahrenheit' ? ((value - 32) * 5) / 9 : value - 273.15;
  return to === 'Celsius' ? c : to === 'Fahrenheit' ? (c * 9) / 5 + 32 : c + 273.15;
}

function convertUnits(q: string): InstantAnswer | null {
  const m = /^(-?\d+(?:[.,]\d+)?)\s*([a-z°/]+)\s+(?:in|to|into|as)\s+([a-z°/]+)$/.exec(
    q.toLowerCase().trim(),
  );
  if (!m) return null;
  const value = Number(m[1].replace(',', '.'));
  const from = UNITS[m[2]];
  const to = UNITS[m[3]];
  if (!from || !to || from.cat !== to.cat || !Number.isFinite(value)) return null;

  const out =
    from.cat === 'temp'
      ? convertTemp(value, from.name, to.name)
      : (value * from.factor) / to.factor;
  if (!Number.isFinite(out)) return null;

  const rounded = Number(out.toPrecision(6));
  const fromLabel = Math.abs(value) === 1 ? from.name : from.plural;
  const toLabel = Math.abs(rounded) === 1 ? to.name : to.plural;
  return {
    kind: 'unit',
    expression: `${formatNumber(value)} ${fromLabel} =`,
    result: `${formatNumber(rounded)} ${toLabel}`,
  };
}

// ---------------------------------------------------------------------------
// "time in tokyo" — pure Intl, no API. Major cities → IANA zones.
// ---------------------------------------------------------------------------

const CITY_ZONES: Record<string, { zone: string; label: string }> = {
  'new york': { zone: 'America/New_York', label: 'New York' },
  nyc: { zone: 'America/New_York', label: 'New York' },
  boston: { zone: 'America/New_York', label: 'Boston' },
  miami: { zone: 'America/New_York', label: 'Miami' },
  toronto: { zone: 'America/Toronto', label: 'Toronto' },
  montreal: { zone: 'America/Toronto', label: 'Montreal' },
  chicago: { zone: 'America/Chicago', label: 'Chicago' },
  dallas: { zone: 'America/Chicago', label: 'Dallas' },
  houston: { zone: 'America/Chicago', label: 'Houston' },
  denver: { zone: 'America/Denver', label: 'Denver' },
  phoenix: { zone: 'America/Phoenix', label: 'Phoenix' },
  'los angeles': { zone: 'America/Los_Angeles', label: 'Los Angeles' },
  la: { zone: 'America/Los_Angeles', label: 'Los Angeles' },
  'san francisco': { zone: 'America/Los_Angeles', label: 'San Francisco' },
  seattle: { zone: 'America/Los_Angeles', label: 'Seattle' },
  vancouver: { zone: 'America/Vancouver', label: 'Vancouver' },
  anchorage: { zone: 'America/Anchorage', label: 'Anchorage' },
  honolulu: { zone: 'Pacific/Honolulu', label: 'Honolulu' },
  'mexico city': { zone: 'America/Mexico_City', label: 'Mexico City' },
  'sao paulo': { zone: 'America/Sao_Paulo', label: 'São Paulo' },
  'buenos aires': { zone: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires' },
  london: { zone: 'Europe/London', label: 'London' },
  dublin: { zone: 'Europe/Dublin', label: 'Dublin' },
  lisbon: { zone: 'Europe/Lisbon', label: 'Lisbon' },
  paris: { zone: 'Europe/Paris', label: 'Paris' },
  berlin: { zone: 'Europe/Berlin', label: 'Berlin' },
  munich: { zone: 'Europe/Berlin', label: 'Munich' },
  amsterdam: { zone: 'Europe/Amsterdam', label: 'Amsterdam' },
  brussels: { zone: 'Europe/Brussels', label: 'Brussels' },
  madrid: { zone: 'Europe/Madrid', label: 'Madrid' },
  barcelona: { zone: 'Europe/Madrid', label: 'Barcelona' },
  rome: { zone: 'Europe/Rome', label: 'Rome' },
  milan: { zone: 'Europe/Rome', label: 'Milan' },
  zurich: { zone: 'Europe/Zurich', label: 'Zurich' },
  geneva: { zone: 'Europe/Zurich', label: 'Geneva' },
  vienna: { zone: 'Europe/Vienna', label: 'Vienna' },
  prague: { zone: 'Europe/Prague', label: 'Prague' },
  warsaw: { zone: 'Europe/Warsaw', label: 'Warsaw' },
  stockholm: { zone: 'Europe/Stockholm', label: 'Stockholm' },
  oslo: { zone: 'Europe/Oslo', label: 'Oslo' },
  copenhagen: { zone: 'Europe/Copenhagen', label: 'Copenhagen' },
  helsinki: { zone: 'Europe/Helsinki', label: 'Helsinki' },
  athens: { zone: 'Europe/Athens', label: 'Athens' },
  istanbul: { zone: 'Europe/Istanbul', label: 'Istanbul' },
  moscow: { zone: 'Europe/Moscow', label: 'Moscow' },
  kyiv: { zone: 'Europe/Kyiv', label: 'Kyiv' },
  cairo: { zone: 'Africa/Cairo', label: 'Cairo' },
  lagos: { zone: 'Africa/Lagos', label: 'Lagos' },
  nairobi: { zone: 'Africa/Nairobi', label: 'Nairobi' },
  johannesburg: { zone: 'Africa/Johannesburg', label: 'Johannesburg' },
  dubai: { zone: 'Asia/Dubai', label: 'Dubai' },
  'tel aviv': { zone: 'Asia/Jerusalem', label: 'Tel Aviv' },
  mumbai: { zone: 'Asia/Kolkata', label: 'Mumbai' },
  delhi: { zone: 'Asia/Kolkata', label: 'Delhi' },
  bangalore: { zone: 'Asia/Kolkata', label: 'Bengaluru' },
  bangkok: { zone: 'Asia/Bangkok', label: 'Bangkok' },
  singapore: { zone: 'Asia/Singapore', label: 'Singapore' },
  'hong kong': { zone: 'Asia/Hong_Kong', label: 'Hong Kong' },
  beijing: { zone: 'Asia/Shanghai', label: 'Beijing' },
  shanghai: { zone: 'Asia/Shanghai', label: 'Shanghai' },
  taipei: { zone: 'Asia/Taipei', label: 'Taipei' },
  seoul: { zone: 'Asia/Seoul', label: 'Seoul' },
  tokyo: { zone: 'Asia/Tokyo', label: 'Tokyo' },
  osaka: { zone: 'Asia/Tokyo', label: 'Osaka' },
  sydney: { zone: 'Australia/Sydney', label: 'Sydney' },
  melbourne: { zone: 'Australia/Melbourne', label: 'Melbourne' },
  perth: { zone: 'Australia/Perth', label: 'Perth' },
  auckland: { zone: 'Pacific/Auckland', label: 'Auckland' },
};

function timeInCity(q: string): InstantAnswer | null {
  const m =
    /^(?:what(?:'s| is) the )?(?:current |local )?time (?:in|at) (.+?)(?: right now| now)?\??$/.exec(
      q.toLowerCase().trim(),
    );
  if (!m) return null;
  const city = CITY_ZONES[m[1].replace(/\s+/g, ' ').trim()];
  if (!city) return null;

  const now = new Date();
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: city.zone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(now);
  const date = new Intl.DateTimeFormat('en-US', {
    timeZone: city.zone,
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(now);

  return {
    kind: 'time',
    expression: `Time in ${city.label} · ${date}`,
    result: time,
  };
}

export function detectInstantAnswer(q: string): InstantAnswer | null {
  const query = q.trim();
  if (!query) return null;

  const calc = evaluateArithmetic(query);
  if (calc !== null) {
    return {
      kind: 'calculator',
      expression: `${query.replace(/\s+/g, ' ')} =`,
      result: formatNumber(calc),
    };
  }

  return convertUnits(query) ?? timeInCity(query);
}
