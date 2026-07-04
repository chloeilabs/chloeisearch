/**
 * Detects queries that should render an interactive instant-answer widget,
 * like Google's calculator, color picker, coin flip, timer, and tip tools.
 * Pure detection — the widgets themselves are client components.
 */

import { evaluate } from './calc';

export type Widget =
  | { kind: 'calculator'; seed: string }
  | { kind: 'color-picker' }
  | { kind: 'coin' }
  | { kind: 'dice'; count: number; sides: number }
  | { kind: 'random'; min: number; max: number }
  | { kind: 'timer'; seconds: number }
  | { kind: 'stopwatch' }
  | { kind: 'tip' };

const clampInt = (n: number, lo: number, hi: number) =>
  Math.min(Math.max(Math.round(n), lo), hi);

/** True when the query is a bare arithmetic expression Google would compute. */
function looksLikeArithmetic(q: string): boolean {
  const s = q.trim();
  if (s.length < 3 || s.length > 100) return false;
  // must contain a binary operator or a function/constant to be "math"
  if (!/[+\-*/^%!×÷√]|sqrt|sin|cos|tan|log|ln|\bpi\b/i.test(s)) return false;
  // a lone "word - word" or year range is not a calculation
  if (/^\d{4}\s*-\s*\d{4}$/.test(s)) return false;
  if (!/\d|pi|e\b/i.test(s)) return false;
  return evaluate(s) !== null;
}

function parseTimer(q: string): number | null {
  const m = /^(?:set (?:a )?)?timer(?: for)?\s+(.+)$/i.exec(q.trim());
  if (!m) return null;
  let total = 0;
  let matched = false;
  const re = /(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)\b/gi;
  let mm: RegExpExecArray | null;
  while ((mm = re.exec(m[1])) !== null) {
    matched = true;
    const n = Number(mm[1]);
    const unit = mm[2].toLowerCase();
    if (unit.startsWith('h')) total += n * 3600;
    else if (unit.startsWith('m')) total += n * 60;
    else total += n;
  }
  if (!matched) {
    // "timer 5 minutes" already covered; bare number → minutes, like Google
    const bare = /^(\d+(?:\.\d+)?)$/.exec(m[1].trim());
    if (bare) total = Number(bare[1]) * 60;
    else return null;
  }
  return total > 0 && total <= 24 * 3600 ? Math.round(total) : null;
}

export function detectWidget(q: string): Widget | null {
  const s = q.trim().toLowerCase();

  // Interactive calculator: the word, or a bare arithmetic expression.
  if (s === 'calculator' || s === 'calc') return { kind: 'calculator', seed: '' };
  if (looksLikeArithmetic(q)) return { kind: 'calculator', seed: q.trim() };

  if (/^colou?r picker$|^html colou?r picker$|^colou?r wheel$/.test(s)) {
    return { kind: 'color-picker' };
  }

  if (/^(flip a coin|coin flip|heads or tails|toss a coin)$/.test(s)) {
    return { kind: 'coin' };
  }

  // "roll a die", "roll 2 dice", "roll 3d6"
  const dice = /^roll\s+(?:(\d+)\s*)?(?:a\s+)?(?:dice|die|d(\d+)|(\d+)-sided\s+dice?)$/.exec(s)
    ?? /^(\d+)d(\d+)$/.exec(s);
  if (dice) {
    const count = clampInt(Number(dice[1] ?? 1) || 1, 1, 12);
    const sides = clampInt(Number(dice[2] ?? dice[3] ?? 6) || 6, 2, 100);
    return { kind: 'dice', count, sides };
  }

  // "random number", "random number 1-100", "random number between 1 and 50"
  const rand = /^random number(?:\s+(?:between\s+)?(-?\d+)(?:\s*(?:-|to|and)\s*)(-?\d+))?$/.exec(s);
  if (rand) {
    let min = rand[1] !== undefined ? Number(rand[1]) : 1;
    let max = rand[2] !== undefined ? Number(rand[2]) : 100;
    if (min > max) [min, max] = [max, min];
    return { kind: 'random', min: clampInt(min, -1e9, 1e9), max: clampInt(max, -1e9, 1e9) };
  }
  if (s === 'random number generator' || s === 'rng') {
    return { kind: 'random', min: 1, max: 100 };
  }

  const timer = parseTimer(q);
  if (timer !== null) return { kind: 'timer', seconds: timer };

  if (s === 'stopwatch' || s === 'online stopwatch') return { kind: 'stopwatch' };

  if (/^tip calculator$|^calculate tip$|^tip calc$/.test(s)) return { kind: 'tip' };

  return null;
}
