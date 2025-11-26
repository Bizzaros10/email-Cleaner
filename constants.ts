// 2.1 Basic Syntax Validation (Regex)
// A robust regex for email validation
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// 2.2 Common Bad Domain/Typos Filter
export const TYPO_DOMAINS = new Set([
  'gmal.com', 'gmil.com', 'gail.com', 'gmail.co', 
  'yaho.com', 'yahooo.com', 'yhoo.com',
  'hotmal.com', 'hotmai.com', 'hotmil.com',
  'outlok.com', 'outlook.co',
  'test.com', 'example.com', 'xyz.com', 'abc.com', 'no-reply.com'
]);

// 2.3 Disposable Email Address (DEA) Filter
// In a real app, this would be a much larger list or an API check
export const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', 'throwawaymail.com', 'mailinator.com', 'guerrillamail.com',
  '10minutemail.com', 'yopmail.com', 'getnada.com', 'temp-mail.org',
  'fakeinbox.com', 'burnermail.io'
]);

// 2.4 Role-Based Email Flagging
export const ROLE_PREFIXES = new Set([
  'admin', 'support', 'info', 'sales', 'marketing', 'contact', 'office',
  'billing', 'help', 'noreply', 'no-reply', 'webmaster', 'hr', 'jobs',
  'enquiries', 'media', 'press'
]);