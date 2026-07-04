'use client';

import { useState } from 'react';

/**
 * Plain <img> (not next/image): result thumbnails come from arbitrary remote
 * hosts, so remotePatterns would be unmanageable and optimization buys nothing
 * locally. Broken images collapse to a neutral placeholder instead of the
 * browser's broken-image icon.
 */
export default function SafeImage({
  src,
  alt,
  className,
  fallbackClassName,
}: {
  src?: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <span aria-hidden className={fallbackClassName ?? className} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      aria-hidden={alt === '' ? true : undefined}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
