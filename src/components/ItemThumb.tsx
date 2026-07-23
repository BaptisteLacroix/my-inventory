import { useEffect, useState } from 'react';
import { getItemImageSrc } from '../lib/inventoryFile';

export function ItemThumb({ photoFile }: { photoFile: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getItemImageSrc(photoFile).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [photoFile]);

  if (!src) return null;
  return <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />;
}
