import { FurnitureItem, CategoryOption, ChatConversation, NotificationItem, UserAccount } from '../types/furniture';
import { DEFAULT_AVATAR_IMAGE } from './defaultAvatar';

export const GUEST_USER: UserAccount = {
  id: 'guest',
  name: '',
  surname: '',
  bio: '',
  email: '',
  avatar: DEFAULT_AVATAR_IMAGE,
  phone: '',
  location: 'Sandton (Gauteng)',
  savedItemIds: [],
  listedItemsCount: 0,
  joinedDate: '',
  isLoggedIn: false,
};

export const INITIAL_USER: UserAccount = GUEST_USER;

export const CATEGORIES: CategoryOption[] = [
  { id: 'all', name: 'All Furniture', iconName: 'Grid', count: 0 },
  { id: 'sofas', name: 'Sofas & Couches', iconName: 'Armchair', count: 0 },
  { id: 'chairs', name: 'Chairs & Benches', iconName: 'Chair', count: 0 },
  { id: 'tables', name: 'Dining & Coffee Tables', iconName: 'Table', count: 0 },
  { id: 'bedroom', name: 'Beds & Wardrobes', iconName: 'Bed', count: 0 },
  { id: 'storage', name: 'Storage & Credenzas', iconName: 'Cabinet', count: 0 },
  { id: 'lighting', name: 'Lamps & Lighting', iconName: 'Lamp', count: 0 },
];

export const INITIAL_FURNITURE: FurnitureItem[] = [];

export const INITIAL_CONVERSATIONS: ChatConversation[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
