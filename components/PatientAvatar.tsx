'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface PatientAvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
  alt?: string;
}

function bustCache(url: string): string {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}t=${Date.now()}`;
}

export function PatientAvatar({ src, name, size = 32, className = '', alt }: PatientAvatarProps) {
  const [validSrc, setValidSrc] = useState<string | null>(null);
  const [bustKey, setBustKey] = useState(0);

  useEffect(() => {
    if (!src) {
      setValidSrc(null);
      return;
    }
    if (src.startsWith('data:')) {
      setValidSrc(src);
      return;
    }
    let cancelled = false;
    const target = bustCache(src);
    fetch(target, { method: 'HEAD' })
      .then(r => {
        if (cancelled) return;
        if (r.ok) {
          setValidSrc(target);
          setBustKey(k => k + 1);
        } else {
          setValidSrc(null);
        }
      })
      .catch(() => { if (!cancelled) setValidSrc(null); });
    return () => { cancelled = true; };
  }, [src]);

  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  if (!validSrc) {
    return (
      <div
        className={`rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold ${className}`}
        style={{ width: size, height: size, fontSize: Math.max(10, size / 3) }}
        aria-label={alt || name}
      >
        {initials}
      </div>
    );
  }

  return (
    <Image
      key={bustKey}
      src={validSrc}
      alt={alt || name}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      onError={() => setValidSrc(null)}
      unoptimized={validSrc.startsWith('data:')}
    />
  );
}
