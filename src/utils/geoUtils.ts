export interface Coordinates {
  lat: number;
  lng: number;
}

// Known coordinates for Gauteng & South African cities/suburbs
export const CITY_COORDINATES: Record<string, Coordinates> = {
  // Pretoria & Tshwane
  'pretoria': { lat: -25.7479, lng: 28.1882 },
  'pretoria central': { lat: -25.7479, lng: 28.1882 },
  'pretoria north': { lat: -25.6738, lng: 28.1751 },
  'pretoria east': { lat: -25.7891, lng: 28.3243 },
  'pretoria west': { lat: -25.7533, lng: 28.1367 },
  'hatfield': { lat: -25.7497, lng: 28.2380 },
  'menlyn': { lat: -25.7828, lng: 28.2755 },
  'centurion': { lat: -25.8603, lng: 28.1895 },
  'mamelodi': { lat: -25.7067, lng: 28.3490 },
  'atteridgeville': { lat: -25.7725, lng: 28.0772 },
  'soshanguve': { lat: -25.5392, lng: 28.1065 },
  'akasia': { lat: -25.6565, lng: 28.0984 },
  'garsfontein': { lat: -25.7958, lng: 28.2974 },
  'hammanskraal': { lat: -25.4055, lng: 28.2789 },
  'irene': { lat: -25.8778, lng: 28.2197 },
  'cullinan': { lat: -25.6706, lng: 28.5236 },
  'bronkhorstspruit': { lat: -25.8080, lng: 28.7424 },
  'ga-rankuwa': { lat: -25.6174, lng: 27.9947 },
  'mabopane': { lat: -25.4984, lng: 28.0069 },

  // Johannesburg & Regions
  'johannesburg': { lat: -26.2041, lng: 28.0473 },
  'johannesburg central': { lat: -26.2041, lng: 28.0473 },
  'johannesburg south': { lat: -26.2641, lng: 28.0273 },
  'sandton': { lat: -26.1076, lng: 28.0567 },
  'rosebank': { lat: -26.1456, lng: 28.0436 },
  'randburg': { lat: -26.0936, lng: 27.9996 },
  'roodepoort': { lat: -26.1625, lng: 27.8725 },
  'midrand': { lat: -25.9992, lng: 28.1263 },
  'soweto': { lat: -26.2678, lng: 27.8585 },
  'alexandra': { lat: -26.1027, lng: 28.0981 },
  'diepsloot': { lat: -25.9333, lng: 28.0167 },
  'diepkloof': { lat: -26.2444, lng: 27.9403 },
  'fourways': { lat: -26.0152, lng: 28.0117 },
  'bryanston': { lat: -26.0560, lng: 28.0224 },
  'melville': { lat: -26.1772, lng: 28.0069 },
  'northcliff': { lat: -26.1444, lng: 27.9694 },
  'lenasia': { lat: -26.3267, lng: 27.8392 },

  // Ekurhuleni / East Rand
  'alberton': { lat: -26.2625, lng: 28.1225 },
  'bedfordview': { lat: -26.1758, lng: 28.1408 },
  'benoni': { lat: -26.1883, lng: 28.3206 },
  'boksburg': { lat: -26.2128, lng: 28.2576 },
  'brakpan': { lat: -26.2361, lng: 28.3694 },
  'edenvale': { lat: -26.1425, lng: 28.1528 },
  'germiston': { lat: -26.2239, lng: 28.1697 },
  'kempton park': { lat: -26.1008, lng: 28.2325 },
  'springs': { lat: -26.2553, lng: 28.4428 },
  'tembisa': { lat: -25.9964, lng: 28.2268 },
  'katlehong': { lat: -26.3314, lng: 28.1539 },
  'vosloorus': { lat: -26.3533, lng: 28.2047 },
  'daveyton': { lat: -26.1433, lng: 28.4319 },
  'nigel': { lat: -26.4317, lng: 28.4772 },
  'heidelberg': { lat: -26.5042, lng: 28.3592 },

  // Vaal / Sedibeng
  'vereeniging': { lat: -26.6731, lng: 27.9261 },
  'vanderbijlpark': { lat: -26.7117, lng: 27.8378 },
  'meyerton': { lat: -26.5817, lng: 28.0133 },
  'sebokeng': { lat: -26.5786, lng: 27.8375 },
  'evaton': { lat: -26.5297, lng: 27.8547 },

  // West Rand
  'krugersdorp': { lat: -26.0967, lng: 27.7667 },
  'randfontein': { lat: -26.1833, lng: 27.7000 },
  'carletonville': { lat: -26.3581, lng: 27.3978 },
  'westonaria': { lat: -26.3197, lng: 27.6517 },
};

/**
 * Calculates distance in kilometers between two coordinates using the Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // 1 decimal place (e.g. 2.4 km)
}

/**
 * Formats kilometers into user-friendly text (e.g., "0.8 km away" or "15 km away")
 */
export function formatDistanceKm(km: number): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters < 100 ? '< 100m' : `${meters}m`} away`;
  }
  if (km < 10) {
    return `${km.toFixed(1)} km away`;
  }
  return `${Math.round(km)} km away`;
}

/**
 * Derives coordinates for a location string if latitude/longitude are not explicitly provided
 */
export function getCoordinatesForLocation(locationName?: string): Coordinates | null {
  if (!locationName) return null;
  const clean = locationName
    .toLowerCase()
    .replace(/\(gauteng\)/gi, '')
    .replace(/\(rsa\)/gi, '')
    .replace(/,.*$/, '')
    .trim();

  // 1. Direct match
  if (CITY_COORDINATES[clean]) {
    return CITY_COORDINATES[clean];
  }

  // 2. Substring match (e.g., "Pretoria Central, Gauteng" -> "pretoria central" or "pretoria")
  for (const key of Object.keys(CITY_COORDINATES)) {
    if (clean.includes(key) || key.includes(clean)) {
      return CITY_COORDINATES[key];
    }
  }

  // Default fallback to Gauteng center if location mentions Gauteng
  if (locationName.toLowerCase().includes('gauteng')) {
    return { lat: -26.1076, lng: 28.0567 }; // Sandton/JHB hub
  }

  return null;
}

const STORAGE_KEY_LOCATION = 'pinin_user_location_cache';
const STORAGE_KEY_PERMISSION = 'pinin_user_location_permission_granted';

export interface UserLocationState {
  coords: Coordinates | null;
  hasPermission: boolean;
  isLoading: boolean;
  error?: string;
  cityName?: string;
}

/**
 * Get cached user location if user previously allowed location tracking
 */
export function getCachedUserLocation(): { coords: Coordinates | null; hasPermission: boolean } {
  try {
    const permitted = localStorage.getItem(STORAGE_KEY_PERMISSION) === 'true';
    if (!permitted) return { coords: null, hasPermission: false };

    const rawCoords = localStorage.getItem(STORAGE_KEY_LOCATION);
    if (rawCoords) {
      const parsed = JSON.parse(rawCoords);
      if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
        return { coords: parsed, hasPermission: true };
      }
    }
    return { coords: null, hasPermission: true };
  } catch {
    return { coords: null, hasPermission: false };
  }
}

/**
 * Requests GPS position from browser with user consent
 */
export function requestBrowserLocation(): Promise<{ coords: Coordinates; cityName?: string }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: Coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        // Cache permission and coordinates
        try {
          localStorage.setItem(STORAGE_KEY_PERMISSION, 'true');
          localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(coords));
        } catch {}

        resolve({ coords });
      },
      (error) => {
        try {
          if (error.code === error.PERMISSION_DENIED) {
            localStorage.setItem(STORAGE_KEY_PERMISSION, 'false');
          }
        } catch {}
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Saves explicit user permission and coords
 */
export function setCachedUserLocation(coords: Coordinates) {
  try {
    localStorage.setItem(STORAGE_KEY_PERMISSION, 'true');
    localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(coords));
  } catch {}
}

/**
 * Clears user location tracking permission
 */
export function clearUserLocationPermission() {
  try {
    localStorage.removeItem(STORAGE_KEY_PERMISSION);
    localStorage.removeItem(STORAGE_KEY_LOCATION);
  } catch {}
}
