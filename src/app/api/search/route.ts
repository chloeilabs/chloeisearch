import { BraveApiError, BraveConfigError, braveSearch } from '../../../lib/brave';
import { parseSearchParamsStrict } from '../../../lib/params';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = parseSearchParamsStrict(searchParams);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const data = await braveSearch(parsed.params);
    return Response.json(data);
  } catch (e) {
    if (e instanceof BraveConfigError) {
      return Response.json({ error: e.message }, { status: 500 });
    }
    if (e instanceof BraveApiError) {
      if (e.status === 429) {
        return Response.json(
          { error: 'rate_limited', retryAfter: e.retryAfter ?? 2 },
          { status: 429 },
        );
      }
      return Response.json(
        { error: 'upstream_error', status: e.status },
        { status: 502 },
      );
    }
    console.error('[api/search]', e);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
