export default function Logo({ size = 'md', showText = true }: { size?: 'sm' | 'md' | 'lg'; showText?: boolean }) {
  const dims = size === 'sm' ? 24 : size === 'lg' ? 44 : 32
  return (
    <div className="flex items-center gap-2.5">
      <svg width={dims} height={dims} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="8" fill="#1A56DB"/>
        <path d="M10 12h16M10 18h10" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M10 24l4-4 4 4 6-8" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="27" cy="24" r="4" fill="#10B981"/>
        <path d="M25 24l1.5 1.5L29 22" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {showText && (
        <div>
          <div className={"font-bold text-blue-700 leading-none " + (size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base')}>
            Lead<span className="text-green-500">Vault</span>
          </div>
          {size !== 'sm' && <div className="text-[9px] text-gray-400 leading-none mt-0.5 tracking-wide">IT PROCUREMENT · PAKISTAN</div>}
        </div>
      )}
    </div>
  )
}
