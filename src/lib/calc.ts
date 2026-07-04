/**
 * Safe scientific-calculator evaluator — recursive-descent, never eval().
 * Supports + − × ÷, ^, %, unary ±, parentheses, factorial (!),
 * constants (π, e), and functions (sin cos tan asin acos atan sinh cosh
 * tanh ln log √). Trig honors a degree/radian mode.
 */

type Token =
  | { t: 'num'; v: number }
  | { t: 'op'; v: string }
  | { t: 'lparen' }
  | { t: 'rparen' }
  | { t: 'fn'; v: string }
  | { t: 'const'; v: number };

const FUNCTIONS = new Set([
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
  'sinh', 'cosh', 'tanh', 'ln', 'log', 'sqrt', 'abs',
]);

function tokenize(input: string): Token[] | null {
  const s = input
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'pi')
    .replace(/√/g, 'sqrt')
    .replace(/\s+/g, '')
    .toLowerCase();
  if (!s) return null;

  const tokens: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) {
      const m = /^\d*\.?\d+(?:e[+-]?\d+)?/.exec(s.slice(i));
      if (!m) return null;
      tokens.push({ t: 'num', v: Number(m[0]) });
      i += m[0].length;
    } else if (/[a-z]/.test(c)) {
      const m = /^[a-z]+/.exec(s.slice(i))!;
      const word = m[0];
      if (word === 'pi') tokens.push({ t: 'const', v: Math.PI });
      else if (word === 'e') tokens.push({ t: 'const', v: Math.E });
      else if (FUNCTIONS.has(word)) tokens.push({ t: 'fn', v: word });
      else return null;
      i += word.length;
    } else if ('+-*/^%!'.includes(c)) {
      tokens.push({ t: 'op', v: c });
      i++;
    } else if (c === '(') {
      tokens.push({ t: 'lparen' });
      i++;
    } else if (c === ')') {
      tokens.push({ t: 'rparen' });
      i++;
    } else {
      return null;
    }
  }
  return tokens;
}

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n) || n > 170) return NaN;
  let r = 1;
  for (let k = 2; k <= n; k++) r *= k;
  return r;
}

export function evaluate(input: string, opts?: { deg?: boolean }): number | null {
  const maybe = tokenize(input);
  if (!maybe || maybe.length === 0) return null;
  const tokens = maybe;
  const deg = opts?.deg ?? false;
  const toRad = (x: number) => (deg ? (x * Math.PI) / 180 : x);
  const fromRad = (x: number) => (deg ? (x * 180) / Math.PI : x);

  let pos = 0;
  const peek = () => tokens[pos];

  function parseAdditive(): number {
    let value = parseTerm();
    while (peek()?.t === 'op' && '+-'.includes((peek() as { v: string }).v)) {
      const op = (tokens[pos++] as { v: string }).v;
      const rhs = parseTerm();
      value = op === '+' ? value + rhs : value - rhs;
    }
    return value;
  }

  function parseTerm(): number {
    let value = parseFactor();
    while (peek()?.t === 'op' && '*/%'.includes((peek() as { v: string }).v)) {
      const op = (tokens[pos++] as { v: string }).v;
      const rhs = parseFactor();
      value = op === '*' ? value * rhs : op === '/' ? value / rhs : value % rhs;
    }
    return value;
  }

  function parseFactor(): number {
    const base = parseUnary();
    if (peek()?.t === 'op' && (peek() as { v: string }).v === '^') {
      pos++;
      return base ** parseFactor(); // right-associative
    }
    return base;
  }

  function parseUnary(): number {
    const p = peek();
    if (p?.t === 'op' && p.v === '-') {
      pos++;
      return -parseUnary();
    }
    if (p?.t === 'op' && p.v === '+') {
      pos++;
      return parseUnary();
    }
    return parsePostfix();
  }

  function parsePostfix(): number {
    let value = parsePrimary();
    while (peek()?.t === 'op' && (peek() as { v: string }).v === '!') {
      pos++;
      value = factorial(value);
    }
    return value;
  }

  function parsePrimary(): number {
    const tok = tokens[pos++];
    if (!tok) throw new Error('unexpected end');
    if (tok.t === 'num') return tok.v;
    if (tok.t === 'const') return tok.v;
    if (tok.t === 'lparen') {
      const value = parseAdditive();
      if (peek()?.t !== 'rparen') throw new Error('unbalanced');
      pos++;
      return value;
    }
    if (tok.t === 'fn') {
      if (peek()?.t !== 'lparen') throw new Error('fn needs (');
      pos++;
      const arg = parseAdditive();
      if (peek()?.t !== 'rparen') throw new Error('unbalanced');
      pos++;
      return applyFn(tok.v, arg);
    }
    throw new Error('unexpected token');
  }

  function applyFn(name: string, x: number): number {
    switch (name) {
      case 'sin': return Math.sin(toRad(x));
      case 'cos': return Math.cos(toRad(x));
      case 'tan': return Math.tan(toRad(x));
      case 'asin': return fromRad(Math.asin(x));
      case 'acos': return fromRad(Math.acos(x));
      case 'atan': return fromRad(Math.atan(x));
      case 'sinh': return Math.sinh(x);
      case 'cosh': return Math.cosh(x);
      case 'tanh': return Math.tanh(x);
      case 'ln': return Math.log(x);
      case 'log': return Math.log10(x);
      case 'sqrt': return Math.sqrt(x);
      case 'abs': return Math.abs(x);
      default: return NaN;
    }
  }

  try {
    const value = parseAdditive();
    if (pos !== tokens.length || !Number.isFinite(value)) return null;
    return value;
  } catch {
    return null;
  }
}
