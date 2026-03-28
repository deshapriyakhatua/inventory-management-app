"use client";

// Inline SVG logos for major Indian e-commerce marketplaces.
// No external URLs — works offline and never breaks.
const MARKETPLACE_SVGS = {
  Amazon: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Amazon "a" smile */}
      <circle cx="50" cy="50" r="50" fill="#000000ff"/>
      <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" fontSize="100" fontWeight="900" fill="white" fontFamily="Arial, sans-serif">a</text>
      <path d="M28 68 Q50 78 72 68" stroke="white" strokeWidth="10" strokeLinecap="round" fill="none"/>
      <path d="M68 62 L74 68 L68 74" stroke="white" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  Flipkart: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="12" fill="#FFD700"/>
      <text x="60%" y="96%" dominantBaseline="middle" textAnchor="middle" fontSize="130" fontWeight="700" fill="#2874F0" fontFamily="Arial, sans-serif">f</text>
    </svg>
  ),
  Myntra: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="12" fill="#FF3F6C"/>
      <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fontSize="44" fontWeight="900" fill="white" fontFamily="Arial, sans-serif">M</text>
    </svg>
  ),
  Meesho: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="12" fill="#9B2CD8"/>
      <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fontSize="44" fontWeight="900" fill="white" fontFamily="Arial, sans-serif">m</text>
    </svg>
  ),
  Ajio: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="12" fill="#dc143c"/>
      <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fontSize="34" fontWeight="900" fill="white" fontFamily="Arial, sans-serif">AJIO</text>
    </svg>
  ),
  Shopsy: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#ffffffff"/>
      <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fontSize="90" fontWeight="900" fill="#0051ffff" fontFamily="Arial, sans-serif">S</text>
    </svg>
  ),
  Website: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="12" fill="#334155"/>
      {/* Globe icon */}
      <circle cx="50" cy="50" r="28" stroke="white" strokeWidth="5" fill="none"/>
      <path d="M50 22 Q60 36 60 50 Q60 64 50 78" stroke="white" strokeWidth="4" fill="none"/>
      <path d="M50 22 Q40 36 40 50 Q40 64 50 78" stroke="white" strokeWidth="4" fill="none"/>
      <line x1="22" y1="50" x2="78" y2="50" stroke="white" strokeWidth="4"/>
      <line x1="26" y1="36" x2="74" y2="36" stroke="white" strokeWidth="3"/>
      <line x1="26" y1="64" x2="74" y2="64" stroke="white" strokeWidth="3"/>
    </svg>
  ),
  Direct: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="12" fill="#1e293b"/>
      <rect x="1" y="1" width="98" height="98" rx="11" stroke="#475569" strokeWidth="2"/>
      {/* Store icon */}
      <rect x="28" y="50" width="44" height="28" fill="none" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round"/>
      <path d="M22 50 L28 30 L72 30 L78 50 Z" fill="none" stroke="#94a3b8" strokeWidth="5" strokeLinejoin="round"/>
      <rect x="42" y="60" width="16" height="18" fill="#94a3b8" rx="2"/>
    </svg>
  ),
};

export default function MarketplaceLogo({ marketplace, size = 20 }) {
  const LogoComponent = MARKETPLACE_SVGS[marketplace];
  if (!LogoComponent) {
    // Fallback: first letter badge
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="12" fill="#334155"/>
        <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fontSize="54" fontWeight="900" fill="#94a3b8" fontFamily="Arial, sans-serif">
          {marketplace ? marketplace[0].toUpperCase() : "?"}
        </text>
      </svg>
    );
  }
  return <LogoComponent size={size} />;
}
