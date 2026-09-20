export interface FurnitureItem {
  id: string;
  title: string;
  location: string;
  price: number;
  originalPrice?: number;
  category: string;
  condition: 'Brand New' | 'Like New' | 'Good' | 'Fair' | 'Vintage';
  imageUrl: string;
  additionalImages?: string[];
  seller: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    reviewCount: number;
    joinedDate: string;
    responseRate: string;
  };
  description: string;
  dimensions?: string;
  material?: string;
  brand?: string;
  postedAt: string;
  isSaved?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  distanceText?: string;
  // Safety & Collection Details
  collectionLat?: number;
  collectionLng?: number;
  collectionSuburb?: string;
  collectionAddress?: string;
  // Verification & Approval Assets (Internal / Admin only - not shown on public listing feed)
  handwrittenDateImage?: string;
  verificationVideo?: string;
}

export interface CategoryOption {
  id: string;
  name: string;
  iconName: string;
  count: number;
}

export interface FilterState {
  category: string;
  categories?: string[];
  minPrice: number;
  maxPrice: number;
  condition: string[];
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'newest';
  locationQuery: string;
  location?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  date?: string;
  isMe: boolean;
  isRead?: boolean;
}

export interface SellFormData {
  title?: string;
  images: string[];
  price: string;
  category: string;
  categoryLabel: string;
  location: string;
  collectionLat?: number;
  collectionLng?: number;
  collectionSuburb?: string;
  collectionAddress?: string;
  model: string;
  isNew: 'New' | 'Used';
  condition: 'Brand New' | 'Like New' | 'Good' | 'Fair' | 'Vintage';
  description: string;
  // Verification for approval only
  handwrittenDateImage?: string;
  verificationVideo?: string;
}

export interface ChatConversation {
  id: string;
  itemId: string;
  itemTitle: string;
  itemImage: string;
  itemPrice: number;
  sellerName: string;
  sellerAvatar: string;
  sellerId?: string;
  buyerId?: string;
  buyerName?: string;
  buyerAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
  isBlocked?: boolean;
  messages: ChatMessage[];
  // Meetup & Collection Info
  collectionSuburb?: string;
  collectionLat?: number;
  collectionLng?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  createdAt?: number;
  read: boolean;
  type: 'price_drop' | 'message' | 'saved_item' | 'system' | 'listing_submitted' | 'listing_approved' | 'listing_rejected';
  targetItemId?: string;
  rejectionReason?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  surname?: string;
  bio?: string;
  email: string;
  avatar: string;
  phone: string;
  location: string;
  savedItemIds: string[];
  listedItemsCount: number;
  joinedDate: string;
  isLoggedIn: boolean;
}
