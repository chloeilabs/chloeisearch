import SafeImage from './SafeImage';
import type { KnowledgePanel } from '../lib/types';

/** Google-style right-hand entity card, built from Brave's infobox. */
export default function KnowledgePanelCard({ panel }: { panel: KnowledgePanel }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      {panel.image && (
        <SafeImage
          src={panel.image}
          alt={panel.title}
          className="h-56 w-full bg-chip object-cover object-top"
          fallbackClassName="hidden"
        />
      )}
      <div className="p-4">
        <h2 className="text-2xl leading-7 text-ink">{panel.title}</h2>
        {panel.category && (
          <div className="mt-0.5 text-sm capitalize text-muted">
            {panel.category}
          </div>
        )}
        {panel.description && (
          <p className="mt-3 line-clamp-6 text-sm leading-relaxed text-rurl">
            {panel.description}
          </p>
        )}
        {panel.website && (
          <a
            href={panel.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm text-accent hover:underline"
          >
            Official website
          </a>
        )}
        {panel.attributes.length > 0 && (
          <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
            {panel.attributes.map((a) => (
              <div key={a.label} className="flex gap-2">
                <dt className="w-24 shrink-0 font-bold text-ink">{a.label}:</dt>
                <dd className="min-w-0 text-rurl">{a.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {panel.profiles.length > 0 && (
          <div className="mt-3 border-t border-line pt-3 text-sm text-muted">
            {panel.profiles.map((p, i) => (
              <span key={p.url}>
                {i > 0 && ' · '}
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  {p.name}
                </a>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
