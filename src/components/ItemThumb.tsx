import { useEffect, useState } from 'react';
import { getItemImageSrc } from '../lib/inventoryFile';
import { Spinner } from './Spinner';

export function ItemThumb({ photoFile }: { photoFile: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    setSrc(null);
    let cancelled = false;
    getItemImageSrc(photoFile).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [photoFile]);

  if (!src) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size={22} />
      </div>
    );
  }
  return <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />;
}
