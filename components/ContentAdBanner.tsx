'use client'
import { useEffect, useState } from 'react'

type Ad = {
  id: string
  imageUrl?: string | null
  linkUrl?: string | null
}

export default function ContentAdBanner({ role }: { role?: string }) {
  const [ads, setAds] = useState<Ad[]>([])

  useEffect(() => {
    fetch('/api/ads?placement=content')
      .then(r => r.json())
      .then(d => setAds(Array.isArray(d) ? d.filter((a: Ad) => !!a.imageUrl) : []))
      .catch(() => {})
  }, [role])

  if (ads.length === 0) return null

  return (
    <div className="mx-6 mb-6 space-y-3">
      {ads.map(ad => {
        const img = (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ad.imageUrl!}
            alt=""
            className="block w-full rounded-xl object-cover ring-1 ring-slate-200/80 shadow-card"
            onError={e => (e.currentTarget.style.display = 'none')}
          />
        )
        return ad.linkUrl ? (
          <a
            key={ad.id}
            href={ad.linkUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="block transition hover:opacity-90"
          >
            {img}
          </a>
        ) : (
          <div key={ad.id}>{img}</div>
        )
      })}
    </div>
  )
}
