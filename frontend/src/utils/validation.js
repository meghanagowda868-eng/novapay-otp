export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const isValidEmail = (email) => {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim());
};

export const isValidPhone = (phone) => {
  if (!phone) return false;
  // Allows international format, spaces, hyphens, parentheses, minimum 5 digits
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  return cleaned.length >= 5 && /^\d+$/.test(cleaned);
};
