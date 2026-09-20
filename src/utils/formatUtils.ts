// Name and text formatting utilities for PinIn

export function formatDisplayName(name?: string | null): string {
  if (!name) return 'User';
  return name
    .trim()
    .split(/\s+/)
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : ''))
    .join(' ');
}
