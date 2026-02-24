
/**
 * Safely encodes a string to Base64 supporting Unicode characters.
 */
export const toBase64 = (str: string): string => {
  try {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (e) {
    // Fallback for older environments
    return btoa(unescape(encodeURIComponent(str)));
  }
};
