import Logo from '../components/Logo';
import ProfileChrome from '../components/ProfileChrome';
import SearchBox from '../components/SearchBox';

const FOOTER_LINKS = {
  left: [
    { label: 'About', href: 'https://brave.com/search/api/' },
    { label: 'How Search works', href: 'https://search.brave.com/help' },
  ],
  right: [
    { label: 'Privacy', href: 'https://brave.com/privacy/browser/' },
    { label: 'Terms', href: 'https://brave.com/terms-of-use/' },
  ],
};

export default function Home() {
  return (
    <>
      <header className="flex items-center justify-end px-4 py-3">
        <ProfileChrome />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-48">
        <h1 className="mb-8" aria-label="Search">
          <Logo size="lg" />
        </h1>
        <SearchBox variant="home" />
      </main>
      <footer className="fixed inset-x-0 bottom-0 bg-footerbg text-sm text-muted">
        <div className="border-b border-line px-8 py-3">United States</div>
        <div className="flex flex-col justify-between gap-y-1 px-4 py-3 sm:flex-row sm:px-8">
          <nav className="flex flex-wrap gap-x-6">
            {FOOTER_LINKS.left.map((l) => (
              <a key={l.label} href={l.href} className="hover:underline">
                {l.label}
              </a>
            ))}
          </nav>
          <nav className="flex flex-wrap gap-x-6">
            {FOOTER_LINKS.right.map((l) => (
              <a key={l.label} href={l.href} className="hover:underline">
                {l.label}
              </a>
            ))}
            <span>Powered by the Brave Search API</span>
          </nav>
        </div>
      </footer>
    </>
  );
}
