import type { SVGProps } from "react";

export type AdminIconName =
  | "areas"
  | "blog"
  | "building"
  | "company"
  | "dashboard"
  | "developers"
  | "domain"
  | "filter"
  | "globe"
  | "home"
  | "imports"
  | "info"
  | "kanban"
  | "language"
  | "layout"
  | "media"
  | "menu"
  | "message"
  | "play"
  | "plus"
  | "profile"
  | "projects"
  | "properties"
  | "refresh"
  | "review"
  | "search"
  | "settings"
  | "spark"
  | "success"
  | "table"
  | "taxonomy"
  | "testimonials"
  | "upload"
  | "users"
  | "videos"
  | "warning"
  | "workspace"
  | "x";

type AdminIconProps = SVGProps<SVGSVGElement> & {
  name: AdminIconName;
  size?: number;
  strokeWidth?: number;
};

export function AdminIcon({
  name,
  size = 18,
  strokeWidth = 1.8,
  className,
  ...props
}: AdminIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {renderPath(name)}
    </svg>
  );
}

function renderPath(name: AdminIconName) {
  switch (name) {
    case "areas":
      return (
        <>
          <path d="M4 10c0-3.866 3.582-7 8-7s8 3.134 8 7c0 5-8 11-8 11S4 15 4 10Z" />
          <circle cx="12" cy="10" r="2.5" />
        </>
      );
    case "blog":
      return (
        <>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8 9h8" />
          <path d="M8 13h8" />
          <path d="M8 17h5" />
        </>
      );
    case "building":
    case "developers":
    case "projects":
      return (
        <>
          <path d="M4 20V7.5A1.5 1.5 0 0 1 5.5 6H10v14" />
          <path d="M10 20V4.5A1.5 1.5 0 0 1 11.5 3h7A1.5 1.5 0 0 1 20 4.5V20" />
          <path d="M7 10h.01" />
          <path d="M7 13h.01" />
          <path d="M13 8h.01" />
          <path d="M13 11h.01" />
          <path d="M16 8h.01" />
          <path d="M16 11h.01" />
          <path d="M12 20h4" />
        </>
      );
    case "company":
      return (
        <>
          <path d="M4 20h16" />
          <path d="M6 20V8l6-4 6 4v12" />
          <path d="M9 12h.01" />
          <path d="M15 12h.01" />
          <path d="M12 20v-4" />
        </>
      );
    case "dashboard":
      return (
        <>
          <rect x="3" y="3" width="8" height="8" rx="2" />
          <rect x="13" y="3" width="8" height="5" rx="2" />
          <rect x="13" y="10" width="8" height="11" rx="2" />
          <rect x="3" y="13" width="8" height="8" rx="2" />
        </>
      );
    case "domain":
    case "globe":
    case "language":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a15.3 15.3 0 0 1 0 18" />
          <path d="M12 3a15.3 15.3 0 0 0 0 18" />
        </>
      );
    case "filter":
      return (
        <>
          <path d="M4 6h16" />
          <path d="M7 12h10" />
          <path d="M10 18h4" />
        </>
      );
    case "home":
    case "properties":
      return (
        <>
          <path d="m4 10 8-6 8 6" />
          <path d="M6 9.5V20h12V9.5" />
          <path d="M10 20v-5h4v5" />
        </>
      );
    case "imports":
      return (
        <>
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 20h14" />
        </>
      );
    case "info":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 10v6" />
          <path d="M12 7h.01" />
        </>
      );
    case "kanban":
      return (
        <>
          <rect x="3" y="4" width="5" height="16" rx="2" />
          <rect x="10" y="4" width="5" height="10" rx="2" />
          <rect x="17" y="4" width="4" height="13" rx="2" />
        </>
      );
    case "layout":
      return (
        <>
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <path d="M3 9h18" />
          <path d="M9 9v11" />
        </>
      );
    case "media":
      return (
        <>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <circle cx="9" cy="10" r="1.5" />
          <path d="m21 15-4.5-4.5a2 2 0 0 0-2.828 0L7 17" />
        </>
      );
    case "menu":
      return (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      );
    case "message":
      return (
        <>
          <path d="M5 7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H9l-4 4v-4a3 3 0 0 1-3-3V7Z" />
        </>
      );
    case "play":
    case "videos":
      return (
        <>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="m10 9 5 3-5 3V9Z" />
        </>
      );
    case "plus":
      return (
        <>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </>
      );
    case "profile":
      return (
        <>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </>
      );
    case "refresh":
      return (
        <>
          <path d="M20 11a8 8 0 1 0 1 4" />
          <path d="M20 4v7h-7" />
        </>
      );
    case "review":
      return (
        <>
          <path d="M5 4h10l4 4v12H5z" />
          <path d="M15 4v4h4" />
          <path d="M9 13h6" />
          <path d="M9 17h4" />
        </>
      );
    case "search":
      return (
        <>
          <circle cx="11" cy="11" r="6" />
          <path d="m20 20-3.5-3.5" />
        </>
      );
    case "settings":
    case "taxonomy":
      return (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6Z" />
        </>
      );
    case "spark":
      return (
        <>
          <path d="m12 3 1.7 4.8L18.5 9l-4.8 1.2L12 15l-1.7-4.8L5.5 9l4.8-1.2L12 3Z" />
          <path d="m19 14 .9 2.5 2.5.9-2.5.9-.9 2.5-.9-2.5-2.5-.9 2.5-.9L19 14Z" />
          <path d="m5 15 .9 2.1 2.1.9-2.1.9L5 21l-.9-2.1-2.1-.9 2.1-.9L5 15Z" />
        </>
      );
    case "success":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 2.5 2.5L16 9" />
        </>
      );
    case "table":
      return (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18" />
          <path d="M8 5v14" />
          <path d="M15 5v14" />
        </>
      );
    case "testimonials":
      return (
        <>
          <path d="M7 16H5a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h2v5Z" />
          <path d="M19 16h-2v-5h2a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2Z" />
          <path d="M10 8a2 2 0 1 1 4 0v9a2 2 0 1 1-4 0V8Z" />
        </>
      );
    case "upload":
      return (
        <>
          <path d="M12 21V9" />
          <path d="m7 14 5-5 5 5" />
          <path d="M5 4h14" />
        </>
      );
    case "users":
      return (
        <>
          <path d="M16 21a5 5 0 0 0-10 0" />
          <circle cx="11" cy="8" r="3" />
          <path d="M21 21a5 5 0 0 0-4-4.87" />
          <path d="M16.5 5.5a3 3 0 1 1 0 5.99" />
        </>
      );
    case "warning":
      return (
        <>
          <path d="M12 3 2.8 19a1.25 1.25 0 0 0 1.1 1.9h16.2a1.25 1.25 0 0 0 1.1-1.9L12 3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </>
      );
    case "workspace":
      return (
        <>
          <rect x="3" y="4" width="8" height="7" rx="2" />
          <rect x="13" y="4" width="8" height="7" rx="2" />
          <rect x="3" y="13" width="18" height="7" rx="2" />
        </>
      );
    case "x":
      return (
        <>
          <path d="m6 6 12 12" />
          <path d="M18 6 6 18" />
        </>
      );
    default:
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </>
      );
  }
}
