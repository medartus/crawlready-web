/**
 * Disposable email domain blocklist.
 *
 * A curated set of the most common disposable/temporary email providers.
 * Phase 0: static list. Phase 1+: consider external service or npm package.
 */

const DISPOSABLE_DOMAINS = new Set([
  // High-volume disposable providers
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'tempmail.com',
  'temp-mail.org',
  'throwaway.email',
  'yopmail.com',
  'yopmail.fr',
  'sharklasers.com',
  'guerrillamail.info',
  'grr.la',
  'guerrillamail.biz',
  'guerrillamail.de',
  'trbvm.com',
  'dispostable.com',
  'trashmail.com',
  'trashmail.me',
  'trashmail.net',
  'maildrop.cc',
  'mailnesia.com',
  'mailtemp.net',
  'tempail.com',
  'tempr.email',
  'discard.email',
  'getnada.com',
  'mohmal.com',
  'burnermail.io',
  'harakirimail.com',
  'emailondeck.com',
  'fakeinbox.com',
  'fakemail.net',
  'mailcatch.com',
  'mfsa.ru',
  'mytemp.email',
  'inboxkitten.com',
  'spamgourmet.com',
  'jetable.org',
  'mintemail.com',
  'tempinbox.com',
  '10minutemail.com',
  '20minutemail.it',
  'crazymailing.com',
  'mailnator.com',
  'wegwerfmail.de',
  'wegwerfmail.net',
  'eyepaste.com',
  'mailexpire.com',
  'tempmailer.com',
]);

/**
 * Check if an email domain is disposable/temporary.
 */
export function isDisposableEmail(email: string): boolean {
  const atIndex = email.indexOf('@');
  if (atIndex < 1) {
    return false;
  }
  const domain = email.slice(atIndex + 1).toLowerCase().trim();
  return DISPOSABLE_DOMAINS.has(domain);
}
