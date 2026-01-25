/**
 * Vietnamese Character Normalization Utility
 * 
 * This module provides functions for normalizing Vietnamese characters
 * to enable bidirectional search matching:
 * - Searching "Nguyen" finds "Nguyễn"
 * - Searching "Nguyễn" finds "Nguyen"
 */

// Mapping of Vietnamese characters with diacritics to their base ASCII equivalents
const VIETNAMESE_CHAR_MAP: Record<string, string> = {
  // a variants
  'á': 'a', 'à': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
  'ă': 'a', 'ắ': 'a', 'ằ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
  'â': 'a', 'ấ': 'a', 'ầ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
  'Á': 'A', 'À': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
  'Ă': 'A', 'Ắ': 'A', 'Ằ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
  'Â': 'A', 'Ấ': 'A', 'Ầ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
  
  // e variants
  'é': 'e', 'è': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
  'ê': 'e', 'ế': 'e', 'ề': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
  'É': 'E', 'È': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
  'Ê': 'E', 'Ế': 'E', 'Ề': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
  
  // i variants
  'í': 'i', 'ì': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
  'Í': 'I', 'Ì': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
  
  // o variants
  'ó': 'o', 'ò': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
  'ô': 'o', 'ố': 'o', 'ồ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
  'ơ': 'o', 'ớ': 'o', 'ờ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
  'Ó': 'O', 'Ò': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
  'Ô': 'O', 'Ố': 'O', 'Ồ': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
  'Ơ': 'O', 'Ớ': 'O', 'Ờ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
  
  // u variants
  'ú': 'u', 'ù': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
  'ư': 'u', 'ứ': 'u', 'ừ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
  'Ú': 'U', 'Ù': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
  'Ư': 'U', 'Ứ': 'U', 'Ừ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
  
  // y variants
  'ý': 'y', 'ỳ': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
  'Ý': 'Y', 'Ỳ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y',
  
  // d variants
  'đ': 'd', 'Đ': 'D',
};

/**
 * Normalize a string by replacing Vietnamese characters with their base ASCII equivalents.
 * This enables searching Vietnamese text with or without diacritics.
 * 
 * @param text - The text to normalize
 * @returns The normalized text with Vietnamese diacritics removed
 */
export function normalizeVietnamese(text: string): string {
  if (!text) return '';
  
  return text
    .split('')
    .map(char => VIETNAMESE_CHAR_MAP[char] || char)
    .join('')
    .toLowerCase();
}

/**
 * Check if a text matches a search query using Vietnamese-aware comparison.
 * This comparison is case-insensitive and treats Vietnamese diacritics as equivalent
 * to their base characters.
 * 
 * @param text - The text to search in
 * @param query - The search query
 * @returns True if the normalized text contains the normalized query
 */
export function vietnameseMatch(text: string, query: string): boolean {
  if (!query) return true;
  if (!text) return false;
  
  const normalizedText = normalizeVietnamese(text);
  const normalizedQuery = normalizeVietnamese(query);
  
  return normalizedText.includes(normalizedQuery);
}

/**
 * Search multiple fields of an object for a query string.
 * Uses Vietnamese-aware matching.
 * 
 * @param obj - The object to search
 * @param fields - Array of field names to search in
 * @param query - The search query
 * @returns True if any field matches the query
 */
export function searchFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[],
  query: string
): boolean {
  if (!query) return true;
  
  return fields.some(field => {
    const value = obj[field];
    if (typeof value === 'string') {
      return vietnameseMatch(value, query);
    }
    return false;
  });
}

/**
 * Get searchable text from nested data for family search.
 * Combines family name, guardian names, student names, and emergency contact names.
 */
export function getFamilySearchableText(family: {
  family_name?: string | null;
  city?: string | null;
  state?: string | null;
  guardians?: Array<{
    name?: string | null;
  }>;
  students?: Array<{
    first_name?: string | null;
    last_name?: string | null;
  }>;
  emergency_contacts?: Array<{
    name?: string | null;
  }>;
}): string {
  const parts: string[] = [];
  
  if (family.family_name) parts.push(family.family_name);
  if (family.city) parts.push(family.city);
  if (family.state) parts.push(family.state);
  
  family.guardians?.forEach(g => {
    if (g.name) parts.push(g.name);
  });
  
  family.students?.forEach(s => {
    if (s.first_name) parts.push(s.first_name);
    if (s.last_name) parts.push(s.last_name);
  });

  family.emergency_contacts?.forEach(c => {
    if (c.name) parts.push(c.name);
  });
  
  return parts.join(' ');
}
