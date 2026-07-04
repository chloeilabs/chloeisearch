import { braveSuggest } from '../../../lib/brave';

// Never returns an error status: suggestions are best-effort and failures
// must stay invisible to someone mid-keystroke.
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q') ?? '';
  try {
    const data = await braveSuggest(q);
    return Response.json(data, {
      headers: {
        // A disabled response must not be browser-cached for an hour — the
        // key (or mode) may change; the client already latches per session.
        'Cache-Control': data.disabled ? 'no-store' : 'private, max-age=3600',
      },
    });
  } catch (e) {
    console.error('[api/suggest]', e);
    return Response.json(
      { suggestions: [] },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
