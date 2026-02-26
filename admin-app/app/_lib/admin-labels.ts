/**
 * Admin-panel UI labels — English-only (admin panel is not locale-routed).
 *
 * Centralised here rather than scattered as inline strings so that:
 * 1. Labels can be found and changed in one place.
 * 2. Adding admin-panel i18n later becomes a simple replacement.
 */
export const ADMIN_LABELS = {
  brand: 'AMP Admin',
  nav: {
    analytics: 'Analytics',
    areas: 'Areas',
    developers: 'Developers',
    inquiries: 'Inquiries',
    leads: 'Leads',
    media: 'Media Library',
    projects: 'Projects',
    properties: 'Properties',
  },
  logout: 'Logout',
  logoutAria: 'Log out of admin panel',
} as const;
