export function memberMatchQuery(firstName: string, lastName: string, email: string, exclude = "") {
  const names = [firstName.trim(), lastName.trim()];
  const address = email.trim().toLowerCase();
  const completeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) ? address : "";
  if (!completeEmail && !names.every(name => name.length >= 2)) return null;
  return { firstName: names.every(name => name.length >= 2) ? names[0] : "", lastName: names.every(name => name.length >= 2) ? names[1] : "", email: completeEmail, exclude };
}
