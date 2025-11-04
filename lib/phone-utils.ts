export function formatPhoneNumber(phone: string, defaultCountryCode: string = '+91'): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (phone.startsWith('+')) return phone;
  if (cleaned.startsWith('91') && cleaned.length === 12) return '+' + cleaned;
  if (cleaned.startsWith('0') && cleaned.length === 11) return defaultCountryCode + cleaned.substring(1);
  if (cleaned.length === 10) return defaultCountryCode + cleaned;
  if (cleaned.length === 11 && cleaned.startsWith('1')) return '+' + cleaned;
  if (cleaned.length === 12) return '+' + cleaned;
  return defaultCountryCode + cleaned;
}

export function validatePhoneNumber(phone: string): { isValid: boolean; formatted: string; error?: string } {
  const formatted = formatPhoneNumber(phone);
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  if (!e164Regex.test(formatted)) {
    return { isValid: false, formatted, error: 'Invalid phone number format. Must be in E.164 format (e.g., +91XXXXXXXXXX)' };
  }
  const digitsOnly = formatted.substring(1);
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return { isValid: false, formatted, error: 'Phone number too short or too long' };
  }
  return { isValid: true, formatted };
}

export function formatPhoneForDisplay(phone: string): string {
  const formatted = formatPhoneNumber(phone);
  if (formatted.startsWith('+91')) {
    const digits = formatted.substring(3);
    if (digits.length === 10) return `+91 ${digits.substring(0, 5)} ${digits.substring(5)}`;
  }
  if (formatted.startsWith('+1')) {
    const digits = formatted.substring(2);
    if (digits.length === 10) return `+1 (${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
  }
  return formatted;
}


