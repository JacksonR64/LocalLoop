// Email address configuration - single source of truth for all LocalLoop emails
// Update the domain here to change all email addresses across the application

const EMAIL_DOMAIN = 'localloopevents.xyz';

export const EMAIL_ADDRESSES = {
  // System emails (automated messages)
  SYSTEM_FROM: `noreply@${EMAIL_DOMAIN}`,
  
  // Contact and support emails
  CONTACT: `hello@${EMAIL_DOMAIN}`,
  SUPPORT: `support@${EMAIL_DOMAIN}`,
  
  // Organizational emails
  ORGANIZER: `organizer@${EMAIL_DOMAIN}`,
  
  // Utility function to generate user emails
  generateUserEmail: (userId: string) => `user-${userId}@${EMAIL_DOMAIN}`,
} as const;

// Legacy aliases for backwards compatibility (if needed)
export const LEGACY_EMAIL_ADDRESSES = {
  HELLO: EMAIL_ADDRESSES.CONTACT,
  NOREPLY: EMAIL_ADDRESSES.SYSTEM_FROM,
} as const;

// Export domain for other configurations
export const EMAIL_DOMAIN_CONFIG = EMAIL_DOMAIN;