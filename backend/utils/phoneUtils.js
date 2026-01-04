/**
 * Phone number utility functions for Ghana phone numbers
 */

/**
 * Converts E.164 format phone number to Ghana local format
 * E.164: +233244121910 -> Local: 0244121910
 * @param {string} e164Number - Phone number in E.164 format (+233...)
 * @returns {string} Phone number in local format (0...)
 */
function e164ToLocal(e164Number) {
    if (!e164Number) return null;
    
    // Remove + and country code 233
    if (e164Number.startsWith('+233')) {
        return '0' + e164Number.substring(4); // +233244121910 -> 0244121910
    }
    
    // If already local format, return as is
    if (e164Number.startsWith('0')) {
        return e164Number;
    }
    
    // If starts with 233 (without +), handle it
    if (e164Number.startsWith('233')) {
        return '0' + e164Number.substring(3);
    }
    
    // Return as is if format is unclear
    return e164Number;
}

/**
 * Converts local format phone number to E.164 format
 * Local: 0244121910 -> E.164: +233244121910
 * @param {string} localNumber - Phone number in local format (0...)
 * @returns {string} Phone number in E.164 format (+233...)
 */
function localToE164(localNumber) {
    if (!localNumber) return null;
    
    // If already E.164 format, return as is
    if (localNumber.startsWith('+233')) {
        return localNumber;
    }
    
    // Remove leading 0 and add +233
    if (localNumber.startsWith('0')) {
        return '+233' + localNumber.substring(1);
    }
    
    // If starts with 233 (without +), add +
    if (localNumber.startsWith('233')) {
        return '+' + localNumber;
    }
    
    // Assume it's local format without leading 0
    return '+233' + localNumber;
}

/**
 * Normalizes phone number to E.164 format (alias for localToE164)
 * Accepts various formats: 0203548414, 233203548414, +233203548414
 * @param {string} phoneNumber - Phone number in any format
 * @returns {string} Phone number in E.164 format (+233...)
 */
function normalizePhoneToE164(phoneNumber) {
    if (!phoneNumber) {
        throw new Error('Phone number is required');
    }
    
    // Remove spaces, dashes, and parentheses
    const cleaned = phoneNumber.trim().replace(/[\s\-\(\)]/g, '');
    
    if (!cleaned) {
        throw new Error('Phone number cannot be empty');
    }
    
    // If already E.164 format, return as is
    if (cleaned.startsWith('+233')) {
        if (cleaned.length !== 13) { // +233XXXXXXXXX (13 chars)
            throw new Error(`Invalid E.164 format: expected 13 characters, got ${cleaned.length}`);
        }
        return cleaned;
    }
    
    // If starts with 233 (without +), add +
    if (cleaned.startsWith('233')) {
        if (cleaned.length !== 12) { // 233XXXXXXXXX (12 chars)
            throw new Error(`Invalid format: expected 12 characters after 233, got ${cleaned.length - 3}`);
        }
        return '+' + cleaned;
    }
    
    // If starts with 0, it's local format
    if (cleaned.startsWith('0')) {
        if (cleaned.length !== 10) { // 0XXXXXXXXX (10 chars)
            throw new Error(`Invalid local format: expected 10 characters, got ${cleaned.length}`);
        }
        return '+233' + cleaned.substring(1);
    }
    
    // If it's 9 digits, assume it's local format without leading 0
    if (cleaned.length === 9 && /^\d+$/.test(cleaned)) {
        return '+233' + cleaned;
    }
    
    // If it's 10 digits and doesn't start with 0, might be missing the 0
    if (cleaned.length === 10 && /^\d+$/.test(cleaned) && !cleaned.startsWith('0')) {
        // Could be missing leading 0, but be careful - could also be invalid
        // Try adding +233 and removing first digit
        throw new Error('Invalid phone number format. Please use format: 0203548414 or +233203548414');
    }
    
    throw new Error(`Invalid phone number format: ${phoneNumber}. Expected format: 0203548414 or +233203548414`);
}

module.exports = {
    e164ToLocal,
    localToE164,
    normalizePhoneToE164
};
