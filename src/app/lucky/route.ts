import { braveSearch } from '../../lib/brave';

/**
 * "I'm Feeling Lucky": 302 to the top web result for q.
 * Falls back to the normal results page (or home) when there's nothing to go to.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') ?? '').trim();
  if (!q) return Response.redirect(new URL('/', url), 302);

  try {
    const data = await braveSearch({
      q,
      tab: 'all',
      page: 1,
      safesearch: 'moderate',
    });
    const first = data.vertical === 'web' ? data.results[0] : undefined;
    if (first) return Response.redirect(first.url, 302);
  } catch {
    // any failure just lands on the results page below
  }
  return Response.redirect(
    new URL(`/search?q=${encodeURIComponent(q)}`, url),
    302,
  );
}
