import Link from 'next/link';
import Filters from './Filters';
import Logo from './Logo';
import ProfileChrome from './ProfileChrome';
import SearchBox from './SearchBox';
import StickyHeader from './StickyHeader';
import Tabs from './Tabs';
import type { SearchQuery } from '../lib/types';

export default function Header({ query }: { query: SearchQuery }) {
  return (
    <StickyHeader>
      <div className="flex items-center gap-4 px-4 pt-5 sm:gap-8 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0" aria-label="Home">
          <Logo size="sm" />
        </Link>
        <SearchBox variant="header" query={query} />
        <div className="ml-auto hidden md:block">
          <ProfileChrome />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center px-4 sm:px-6 lg:pl-[164px]">
        <Tabs query={query} />
        <Filters query={query} />
      </div>
    </StickyHeader>
  );
}
