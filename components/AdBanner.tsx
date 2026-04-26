import prisma from '@/lib/prisma'

export default async function AdBanner({ role }: { role?: string }) {
  let ads: any[] = []
  try {
    ads = await prisma.advertisement.findMany({
      where: {
        isActive: true,
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

  if (ads.length === 0) {
    return (
      <div className="mx-6 mb-6 rounded-xl border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 relative">
        <div className="absolute top-2 right-3 text-[9px] font-bold text-amber-400 uppercase tracking-widest">Sponsored</div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded bg-amber-400 flex items-center justify-center flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 11V5l5-4 5 4v6H7V7H5v4H1z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div className="text-sm font-bold text-amber-700">TO LET - Advertisement Space</div>
        </div>
        <div className="text-xs text-amber-800 leading-relaxed mb-3">
          Advertise your IT products and services here and reach hundreds of verified IT vendors and businesses across Pakistan through Lead Vault.
        </div>
        <div className="bg-amber-100 rounded-lg px-3 py-2 inline-block">
          <div className="text-[10px] text-amber-600 mb-0.5">Book this space</div>
          <div className="text-sm font-bold text-amber-800">advert@leadvault.pk</div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-6 mb-6 space-y-3">
      {ads.map((ad: any) => {
        const bg = ad.bgColor || 'from-amber-50 to-yellow-50 border-amber-300'
        const content = (
          <div key={ad.id} className={"rounded-xl border-2 border-dashed bg-gradient-to-br p-4 relative overflow-hidden " + bg}>
            <div className="absolute top-2 right-3 text-[9px] font-bold text-amber-400 uppercase tracking-widest">Sponsored</div>
            <div className="flex gap-4 items-center">
              {ad.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ad.imageUrl} alt={ad.title}
                  className="h-20 w-32 object-cover rounded-lg flex-shrink-0 border border-white/50" />
              )}
              <div className="flex-1">
                <div className="text-sm font-bold text-gray-800 mb-1">{ad.title}</div>
                {ad.bodyText && <div className="text-xs text-gray-600 leading-relaxed mb-2">{ad.bodyText}</div>}
                {(ad.linkUrl || ad.contactEmail) && (
                  <div className="inline-block bg-white/70 rounded-lg px-3 py-1.5">
                    <div className="text-[10px] text-gray-500 mb-0.5">Contact</div>
                    <div className="text-xs font-bold text-blue-700">{ad.linkUrl || ad.contactEmail}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
        return ad.linkUrl ? (
          <a key={ad.id} href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="block hover:opacity-90 transition">{content}</a>
        ) : <div key={ad.id}>{content}</div>
      })}
    </div>
  )
}
