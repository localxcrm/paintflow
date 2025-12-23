/**
 * Geocoding using Nominatim (OpenStreetMap)
 * Free, no API key required
 *
 * Limitations:
 * - Max 1 request per second
 * - Requires User-Agent header
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

interface GeocodingResult {
  lat: number;
  lng: number;
}

/**
 * Convert address to latitude/longitude coordinates
 * @param address Street address (e.g., "Rua das Flores, 123")
 * @param city City name (e.g., "Sao Paulo")
 * @param state Optional state (e.g., "SP")
 * @returns Coordinates or null if not found
 */
export async function geocodeAddress(
  address: string,
  city: string,
  state?: string | null
): Promise<GeocodingResult | null> {
  try {
    // Build query string
    const parts = [address, city];
    if (state) parts.push(state);
    parts.push('USA');

    const query = parts.join(', ');
    const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PaintPro/1.0 (contact@paintpro.com)', // Nominatim requires User-Agent
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Geocoding API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (data && Array.isArray(data) && data.length > 0) {
      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      };
    }

    console.log('No geocoding results for:', query);
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Geocode with retry for rate limiting
 * Nominatim has a 1 request/second limit
 */
export async function geocodeAddressWithRetry(
  address: string,
  city: string,
  state?: string | null,
  maxRetries = 2
): Promise<GeocodingResult | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await geocodeAddress(address, city, state);
      if (result) return result;

      // If no result and more attempts left, wait and retry
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1100)); // Wait 1.1 seconds
      }
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1100));
    }
  }
  return null;
}
