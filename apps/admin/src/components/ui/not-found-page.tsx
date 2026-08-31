import Link from "next/link";

/**
 * Custom branded 404 page — spacious layout that utilizes full viewport.
 * Shows navigation suggestions only when user is authenticated.
 */
export function NotFoundPage({
  title = "Page not found",
  message = "The page you're looking for doesn't exist or has been moved.",
  suggestions,
  isAuthenticated = false,
}: {
  title?: string;
  message?: string;
  suggestions?: Array<{ label: string; href: string; icon?: React.ReactNode }>;
  isAuthenticated?: boolean;
}) {
  const defaultSuggestions = suggestions ?? [
    { label: "Dashboard", href: "/" },
    { label: "Requirements", href: "/requirements" },
    { label: "Vendors", href: "/vendors" },
    { label: "Registrations", href: "/registrations" },
    { label: "Content", href: "/content" },
    { label: "Profile", href: "/profile" },
  ];

  return (
    <div className="flex h-full min-h-full w-full flex-col items-center justify-center px-6 py-8">
      {/* Top section: SVG + 404 badge */}
      <div className="relative mb-6 md:mb-8">
        <svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-[160px] w-[160px] drop-shadow-xl md:h-[220px] md:w-[220px]"
        >
          <ellipse cx="100" cy="185" rx="80" ry="8" fill="#E8F4FD" />
          <rect x="60" y="50" width="80" height="135" rx="4" fill="#0073bc" />
          <rect x="72" y="65" width="12" height="12" rx="2" fill="white" opacity="0.9" />
          <rect x="94" y="65" width="12" height="12" rx="2" fill="white" opacity="0.9" />
          <rect x="116" y="65" width="12" height="12" rx="2" fill="white" opacity="0.9" />
          <rect x="72" y="90" width="12" height="12" rx="2" fill="white" opacity="0.9" />
          <rect x="94" y="90" width="12" height="12" rx="2" fill="white" opacity="0.9" />
          <rect x="116" y="90" width="12" height="12" rx="2" fill="white" opacity="0.9" />
          <rect x="72" y="115" width="12" height="12" rx="2" fill="white" opacity="0.9" />
          <rect x="94" y="115" width="12" height="12" rx="2" fill="white" opacity="0.9" />
          <rect x="116" y="115" width="12" height="12" rx="2" fill="white" opacity="0.9" />
          <rect x="72" y="140" width="12" height="12" rx="2" fill="white" opacity="0.9" />
          <rect x="116" y="140" width="12" height="12" rx="2" fill="white" opacity="0.9" />
          <rect x="92" y="155" width="16" height="30" rx="2" fill="#005a94" />
          <circle cx="104" cy="170" r="2" fill="#FFD700" />
          <rect x="25" y="90" width="35" height="95" rx="3" fill="#4aa3d8" />
          <rect x="32" y="100" width="8" height="8" rx="1" fill="white" opacity="0.9" />
          <rect x="45" y="100" width="8" height="8" rx="1" fill="white" opacity="0.9" />
          <rect x="32" y="118" width="8" height="8" rx="1" fill="white" opacity="0.9" />
          <rect x="45" y="118" width="8" height="8" rx="1" fill="white" opacity="0.9" />
          <rect x="32" y="136" width="8" height="8" rx="1" fill="white" opacity="0.9" />
          <rect x="45" y="136" width="8" height="8" rx="1" fill="white" opacity="0.9" />
          <rect x="140" y="70" width="35" height="115" rx="3" fill="#4aa3d8" />
          <rect x="147" y="80" width="8" height="8" rx="1" fill="white" opacity="0.9" />
          <rect x="160" y="80" width="8" height="8" rx="1" fill="white" opacity="0.9" />
          <rect x="147" y="98" width="8" height="8" rx="1" fill="white" opacity="0.9" />
          <rect x="160" y="98" width="8" height="8" rx="1" fill="white" opacity="0.9" />
          <rect x="147" y="116" width="8" height="8" rx="1" fill="white" opacity="0.9" />
          <rect x="160" y="116" width="8" height="8" rx="1" fill="white" opacity="0.9" />
          <rect x="147" y="134" width="8" height="8" rx="1" fill="white" opacity="0.9" />
          <rect x="160" y="134" width="8" height="8" rx="1" fill="white" opacity="0.9" />
          <line x1="100" y1="50" x2="100" y2="30" stroke="#0073bc" strokeWidth="3" />
          <circle cx="100" cy="26" r="4" fill="#FF6B6B" />
          <circle cx="15" cy="175" r="10" fill="#10B981" />
          <rect x="13" y="175" width="4" height="10" fill="#92400E" />
          <circle cx="185" cy="175" r="10" fill="#10B981" />
          <rect x="183" y="175" width="4" height="10" fill="#92400E" />
        </svg>

        {/* 404 Badge */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
          <span className="bg-brand-blue inline-flex h-14 w-14 items-center justify-center rounded-full border-4 border-white text-2xl font-extrabold text-white shadow-xl md:h-16 md:w-16 md:text-3xl">
            404
          </span>
        </div>
      </div>

      {/* Title & Message */}
      <div className="mb-8 text-center md:mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 md:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-lg text-base leading-relaxed text-zinc-500 md:text-lg">
          {message}
        </p>
      </div>

      {/* Page Suggestions — only for authenticated users */}
      {isAuthenticated && (
        <div className="w-full max-w-2xl">
          <p className="mb-5 text-center text-xs font-bold tracking-widest text-zinc-400 uppercase">
            Quick Navigation
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5">
            {defaultSuggestions.map((suggestion) => (
              <Link
                key={suggestion.href}
                href={suggestion.href}
                className="group hover:border-brand-blue flex flex-col items-center gap-3 rounded-2xl border-2 border-zinc-200 bg-white px-5 py-6 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg md:py-7"
              >
                <div className="bg-brand-blue/10 text-brand-blue group-hover:bg-brand-blue flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:text-white md:h-14 md:w-14">
                  {suggestion.icon ?? (
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  )}
                </div>
                <span className="group-hover:text-brand-blue text-sm font-bold text-zinc-700 transition-colors md:text-base">
                  {suggestion.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Non-authenticated: show sign-in prompt */}
      {!isAuthenticated && (
        <div>
          <Link
            href="/login"
            className="bg-brand-blue hover:bg-brand-blue/90 inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-base font-bold text-white shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl"
          >
            Sign in to continue
          </Link>
        </div>
      )}

      {/* Help text */}
      <p className="mt-8 text-sm text-zinc-400 md:mt-10">
        If you believe this is an error, please{" "}
        <Link
          href={isAuthenticated ? "/profile" : "/login"}
          className="text-brand-blue font-semibold hover:underline"
        >
          contact support
        </Link>
        .
      </p>
    </div>
  );
}
