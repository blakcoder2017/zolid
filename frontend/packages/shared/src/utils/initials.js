/**
 * Generate initials from a full name
 * @param {string} name - Full name (e.g., "John Doe", "Mary Jane Smith")
 * @returns {string} - Initials (e.g., "JD", "MJS")
 */
export function getInitials(name) {
  if (!name || typeof name !== 'string') {
    return '??';
  }

  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 0) {
    return '??';
  }

  if (parts.length === 1) {
    // Single name - return first two letters
    return parts[0].substring(0, 2).toUpperCase();
  }

  // Multiple names - return first letter of first and last name
  const first = parts[0].charAt(0).toUpperCase();
  const last = parts[parts.length - 1].charAt(0).toUpperCase();
  
  return first + last;
}
