'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CharacterImageFallback } from './character-image-fallback';

export function CharacterImage({ src, alt, sizes }: { src: string; alt: string; sizes: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <>
      {/* Sits under the image: visible while it loads, and alone once it fails */}
      <CharacterImageFallback />
      {src && !failed ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover"
          onError={() => setFailed(true)}
          // Catches images that errored before hydration, when onError wasn't attached yet
          ref={(img) => {
            if (img?.complete && img.naturalWidth === 0) setFailed(true);
          }}
        />
      ) : null}
    </>
  );
}
