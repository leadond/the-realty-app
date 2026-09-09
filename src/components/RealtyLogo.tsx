type RealtyLogoProps = {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
};

const sizeClasses = {
  sm: {
    mark: "h-10 w-16",
    title: "text-sm",
    subtitle: "text-[9px]",
  },
  md: {
    mark: "h-12 w-20",
    title: "text-base",
    subtitle: "text-[10px]",
  },
  lg: {
    mark: "h-16 w-28",
    title: "text-xl",
    subtitle: "text-[10px]",
  },
};

export default function RealtyLogo({ size = "md", showWordmark = true, className = "" }: RealtyLogoProps) {
  const styles = sizeClasses[size];

  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <div className={`${styles.mark} relative shrink-0`} aria-hidden="true">
        <svg viewBox="0 0 152 88" className="h-full w-full overflow-visible" role="img" aria-label="The Realty App logo mark">
          <rect x="8" y="8" width="136" height="72" rx="2" fill="#111917" />
          <rect x="14" y="14" width="124" height="60" rx="1" fill="none" stroke="#c9a566" strokeWidth="1.8" />
          <path d="M26 24h100M26 64h100" stroke="#d9bd7d" strokeWidth="1.4" strokeLinecap="round" opacity=".78" />
          <path d="M76 13v62" stroke="#c9a566" strokeWidth="1" opacity=".28" />
          <path d="M39 30c9-8 20-11 37-11s28 3 37 11" fill="none" stroke="#f0d79a" strokeWidth="1.1" strokeLinecap="round" opacity=".55" />
          <text
            x="76"
            y="55"
            fill="#f7f0df"
            fontFamily="Georgia, Times New Roman, serif"
            fontSize="37"
            fontWeight="600"
            letterSpacing="5"
            textAnchor="middle"
          >
            TRA
          </text>
          <path d="M39 59h74" stroke="#c9a566" strokeWidth="1" strokeLinecap="round" opacity=".45" />
          <circle cx="23" cy="44" r="2" fill="#c9a566" opacity=".88" />
          <circle cx="129" cy="44" r="2" fill="#c9a566" opacity=".88" />
          <text
            x="76"
            y="70"
            fill="#c9a566"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="6"
            fontWeight="700"
            letterSpacing="2.4"
            textAnchor="middle"
          >
            HOUSTON
          </text>
        </svg>
      </div>
      {showWordmark && (
        <div className="min-w-0">
          <p className={`${styles.subtitle} font-bold uppercase tracking-[0.24em] text-[#8a5d24]`}>Real Estate Intelligence</p>
          <p className={`${styles.title} truncate font-semibold leading-tight text-[#111917]`}>The Realty App</p>
        </div>
      )}
    </div>
  );
}
