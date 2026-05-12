import { useEffect, useRef, useState } from 'react';
import { fetchAuthBlob } from '../api/api';

/**
 * Renders an <img> that fetches the src URL with the JWT Authorization header.
 * Falls back to `fallback` (a ReactNode) while loading or on error.
 */
export default function AuthImage({ src, alt, style, className, fallback = null }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState(false);
  // Keep a ref to the current blob URL so the cleanup can revoke it correctly
  const blobRef = useRef(null);

  useEffect(() => {
    if (!src) { setError(true); return; }

    let cancelled = false;
    setError(false);
    setBlobUrl(null);

    fetchAuthBlob(src)
      .then(url => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        // Revoke the previous blob before setting the new one
        if (blobRef.current) URL.revokeObjectURL(blobRef.current);
        blobRef.current = url;
        setBlobUrl(url);
      })
      .catch(() => { if (!cancelled) setError(true); });

    return () => {
      cancelled = true;
    };
  }, [src]);

  // Revoke on unmount
  useEffect(() => {
    return () => {
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    };
  }, []);

  if (!src || error) return fallback;
  if (!blobUrl) return fallback;

  return <img src={blobUrl} alt={alt || ''} style={style} className={className} />;
}
