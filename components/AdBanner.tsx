import prisma from '@/lib/prisma'

export default async function AdBanner({ role }: { role?: string }) {
  let ads: any[] = []
  try {
    ads = await prisma.advertisement.findMany({
      where: {
        isActive: true,
        imageUrl: { not: null },
        OR: [
          { showTo: 'all' },
          ...(role ? [{ showTo: role }] : []),
        ],
        AND: [{ OR: [{ placement: 'both' }, { placement: 'content' }] }],
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 3,
    })
  } catch {}

  if (ads.length === 0) return null

  return (
    <div className="mx-6 mb-6 space-y-3">
      {ads.map((ad: any) => {
        const img = (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ad.imageUrl}
            alt=""
            className="block w-full rounded-xl object-cover ring-1 ring-slate-200/80 shadow-card"
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
