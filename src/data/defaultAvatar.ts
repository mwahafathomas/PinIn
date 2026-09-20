// Default avatar icon matching the uploaded clean silhouette placeholder (officialapppage13.jpeg)
export const DEFAULT_AVATAR_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%"><rect width="500" height="500" fill="%23FFFFFF"/><circle cx="250" cy="180" r="95" fill="%239CA3AF"/><path d="M 250,285 C 135,285 45,375 42,500 L 458,500 C 455,375 365,285 250,285 Z" fill="%239CA3AF"/></svg>';

export const isDefaultAvatar = (avatarUrl?: string): boolean => {
  if (!avatarUrl) return true;
  if (avatarUrl === DEFAULT_AVATAR_IMAGE) return true;
  if (avatarUrl.includes('data:image/svg+xml') && avatarUrl.includes('9CA3AF')) return true;
  return false;
};

export const getSafeAvatar = (avatarUrl?: string): string => {
  if (!avatarUrl || avatarUrl.trim() === '') {
    return DEFAULT_AVATAR_IMAGE;
  }
  return avatarUrl;
};
