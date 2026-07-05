import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import AlteredQueryNotice from '../../components/AlteredQueryNotice';
import AnswerBox, { AnswerSkeleton } from '../../components/AnswerBox';
import DidYouMean from '../../components/DidYouMean';
import InlineVideos from '../../components/InlineVideos';
import InstantCard from '../../components/InstantCard';
import PeopleAlsoAsk from '../../components/PeopleAlsoAsk';
import StockCard, { StockSkeleton } from '../../components/StockCard';
import WeatherCard, { WeatherSkeleton } from '../../components/WeatherCard';
import EmptyState from '../../components/EmptyState';
import ErrorState, { type SearchErrorKind } from '../../components/ErrorState';
import Header from '../../components/Header';
import Pagination from '../../components/Pagination';
import KnowledgePanelCard from '../../components/KnowledgePanelCard';
import RelatedSearches from '../../components/RelatedSearches';
import ImageGrid from '../../components/results/ImageGrid';
import NewsList from '../../components/results/NewsList';
import VideoGrid from '../../components/results/VideoGrid';
import WebResults from '../../components/results/WebResults';
import { COUNTRIES } from '../../lib/constants';
import {
  BraveApiError,
  BraveConfigError,
  braveSearch,
  braveSpellcheck,
} from '../../lib/brave';
import WidgetHost from '../../components/widgets/WidgetHost';
import { detectInstantAnswer } from '../../lib/instant';
import { buildSearchUrl, normalizeSearchParams } from '../../lib/params';
import { detectWidget } from '../../lib/widgets';
import type { SearchData, SearchQuery } from '../../lib/types';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = normalizeSearchParams(await searchParams);
  return { title: query ? `${query.q} - Search` : 'Search' };
}

/**
 * The page shell (header, search box, tabs, footer) renders immediately;
 * only the results block below waits on Brave. The Suspense boundary is
 * keyed by the canonical URL so every new search shows the skeleton instead
 * of freezing on the previous results.
 */
export default async function SearchPage({ searchParams }: Props) {
  const query = normalizeSearchParams(await searchParams);
  if (!query) redirect('/');

  return (
    <>
      <Header query={query} />
      <main className="flex-1 px-4 pt-4 sm:px-6 lg:pl-[164px] lg:pr-8">
        <h1 className="sr-only">Search results for &ldquo;{query.q}&rdquo;</h1>
        <Suspense key={buildSearchUrl(query)} fallback={<ResultsSkeleton />}>
          <SearchResults query={query} />
        </Suspense>
      </main>
      <footer className="border-t border-line bg-footerbg px-4 py-4 text-sm text-muted sm:px-6 lg:pl-[164px]">
        {COUNTRIES.find((c) => c.value === query.country)?.label ??
          'United States'}{' '}
        · results provided by the Brave Search API
      </footer>
    </>
  );
}

function ResultsSkeleton() {
  return (
    <div className="max-w-[600px] animate-pulse pt-2" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="mb-8">
          <div className="mb-2 h-4 w-1/3 rounded bg-chip" />
          <div className="mb-2 h-5 w-2/3 rounded bg-chip" />
          <div className="h-4 w-full rounded bg-chip" />
        </div>
      ))}
    </div>
  );
}

async function SearchResults({ query }: { query: SearchQuery }) {
  // Spellcheck and AI answers only decorate the first page of web results.
  const isWebFirstPage = query.tab === 'all' && query.page === 1;
  // Interactive instant tool (calculator, color picker, timer…) — no API.
  const widget = isWebFirstPage ? detectWidget(query.q) : null;
  // Static instant card (unit / time conversion) — no API.
  const instant = isWebFirstPage && !widget ? detectInstantAnswer(query.q) : null;
  // Any instant tool/answer means Google shows no spellcheck or AI card.
  const hasInstant = Boolean(widget || instant);

  let data: SearchData | null = null;
  let errorKind: SearchErrorKind | null = null;
  let retryAfter: number | undefined;
  // Kick off spellcheck in parallel with the search (separate key = separate
  // rate limit); braveSpellcheck never throws. Skipped for calculator-style
  // queries — there is nothing to correct.
  const spellcheckPromise =
    isWebFirstPage && !hasInstant ? braveSpellcheck(query) : null;
  try {
    data = await braveSearch(query);
  } catch (e) {
    if (e instanceof BraveConfigError) {
      errorKind = 'config';
    } else if (e instanceof BraveApiError && e.status === 429) {
      errorKind = 'rate_limited';
      retryAfter = e.retryAfter;
    } else if (e instanceof BraveApiError) {
      errorKind = 'upstream';
    } else {
      throw e; // unexpected — let error.tsx handle it
    }
  }
  const corrected = spellcheckPromise ? await spellcheckPromise : null;

  if (errorKind) return <ErrorState kind={errorKind} retryAfter={retryAfter} />;
  if (!data) return null;
  if (data.results.length === 0) return <EmptyState query={query} />;

  return (
    <div className="gap-12 xl:flex">
      <div className="min-w-0 flex-1">
        <p className="mb-4 text-[13px] text-muted">
          {data.results.length} results
          {data.page > 1 ? ` · page ${data.page}` : ''} ·{' '}
          {((data.tookMs ?? 0) / 1000).toFixed(2)} seconds
        </p>
        {data.vertical === 'web' && data.alteredQuery && !query.nospell ? (
          <AlteredQueryNotice query={query} altered={data.alteredQuery} />
        ) : (
          corrected && <DidYouMean query={query} corrected={corrected} />
        )}
        {widget && <WidgetHost widget={widget} />}
        {instant && <InstantCard answer={instant} />}
        {!widget && data.vertical === 'web' && data.richHint?.vertical === 'weather' && (
          <Suspense fallback={<WeatherSkeleton />}>
            <WeatherCard callbackKey={data.richHint.callbackKey} />
          </Suspense>
        )}
        {!widget && data.vertical === 'web' && data.richHint?.vertical === 'stocks' && (
          <Suspense fallback={<StockSkeleton />}>
            <StockCard callbackKey={data.richHint.callbackKey} />
          </Suspense>
        )}
        {/* No AI answer for instant-tool/weather/stock queries — Google doesn't either. */}
        {isWebFirstPage &&
          !hasInstant &&
          !(data.vertical === 'web' && data.richHint) && (
            <Suspense fallback={<AnswerSkeleton />}>
              <AnswerBox query={query} />
            </Suspense>
          )}
        {data.vertical === 'web' && (
          <WebResults
            results={data.results}
            afterThird={<PeopleAlsoAsk faq={data.faq} />}
            afterSixth={
              <InlineVideos videos={data.inlineVideos} query={query} />
            }
          />
        )}
        {data.vertical === 'images' && <ImageGrid results={data.results} />}
        {data.vertical === 'news' && <NewsList results={data.results} />}
        {data.vertical === 'videos' && <VideoGrid results={data.results} />}
        {data.vertical === 'web' && (
          <Suspense fallback={null}>
            <RelatedSearches query={query} />
          </Suspense>
        )}
        {data.vertical !== 'images' && (
          <Pagination query={query} hasMore={data.hasMore} />
        )}
      </div>
      {data.vertical === 'web' && data.infobox && (
        <aside className="mb-8 hidden w-[368px] shrink-0 xl:block">
          <KnowledgePanelCard panel={data.infobox} />
        </aside>
      )}
    </div>
  );
}
