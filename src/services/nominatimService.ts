/**
 * Free Reverse Geocoding Service using OpenStreetMap Nominatim
 * No API key required.
 */

export interface ReverseGeocodeResult {
  suburb: string;
  city: string;
  fullAddress: string;
  lat: number;
  lng: number;
}

export async function reverseGeocodeWithNominatim(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Nominatim reverse geocode response not OK:', response.status);
      return null;
    }

    const data = await response.json();
    if (!data || !data.address) {
      return null;
    }

    const address = data.address;
    const suburb =
      address.suburb ||
      address.neighbourhood ||
      address.residential ||
      address.quarter ||
      address.city_district ||
      address.village ||
      address.town ||
      address.city ||
      address.municipality ||
      '';

    const city =
      address.city ||
      address.town ||
      address.municipality ||
      address.county ||
      address.state ||
      'Gauteng';

    return {
      suburb: suburb.trim(),
      city: city.trim(),
      fullAddress: data.display_name || '',
      lat,
      lng,
    };
  } catch (err) {
    console.warn('Nominatim reverse geocode error:', err);
    return null;
  }
}
