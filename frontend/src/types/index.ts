export type UserRole = 'CUSTOMER' | 'FARMER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  username: string;
  phone_number?: string;
  role: UserRole;
  avatar?: string | null;
  customer_profile?: CustomerProfile;
  farmer_profile?: FarmerSummary;
  created_at: string;
  updated_at: string;
}

export interface CustomerProfile {
  id: string;
  business_name?: string;
  business_type: 'INDIVIDUAL' | 'RESTAURANT' | 'HOTEL' | 'LOCAL_STORE' | 'OTHER';
  delivery_instructions?: string;
}

export interface Address {
  id: string;
  label: string;
  recipient_name: string;
  phone_number: string;
  province: string;
  district: string;
  commune?: string;
  street_address: string;
  latitude?: number | null;
  longitude?: number | null;
  is_default: boolean;
  created_at: string;
}

export interface FarmerSummary {
  id: string;
  farm_name: string;
  slug: string;
  province: string;
  is_verified: boolean;
  verification_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  profile_image?: string | null;
  cover_image?: string | null;
  rating_avg: number;
  product_count?: number;
}

export interface FarmerProfile extends FarmerSummary {
  bio: string;
  story: string;
  farming_practice: 'ORGANIC' | 'CONVENTIONAL' | 'HYDROPONIC' | 'PERMACULTURE' | 'REGENERATIVE';
  years_of_experience: number;
  district: string;
  commune?: string;
  address_line: string;
  latitude?: number | null;
  longitude?: number | null;
  phone_number?: string;
  website_url?: string;
  bank_name?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bakong_account_id?: string;
  farmer_qr_image?: string | null;
  rating_count: number;
  products?: Product[];
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  image?: string | null;
  is_active: boolean;
  display_order: number;
  product_count: number;
}

export interface ProductImage {
  id: string;
  image: string;
  thumbnail?: string | null;
  medium?: string | null;
  image_url?: string | null;
  thumbnail_url?: string | null;
  medium_url?: string | null;
  blur_placeholder?: string;
  width?: number | null;
  height?: number | null;
  is_primary: boolean;
  alt_text?: string;
  display_order: number;
}

export interface Inventory {
  available_quantity: string;
  reserved_quantity: string;
  low_stock_threshold: string;
  last_restocked_at?: string;
}

export interface VolumeDiscountTier {
  id: string;
  min_quantity: string;
  discount_percentage: string;
  unit_price: string;
}

export interface Product {
  id: string;
  farmer: FarmerSummary;
  category: Category;
  category_name?: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  price: string;
  unit: 'KG' | 'GRAM' | 'TON' | 'BASKET' | 'BOX' | 'BUNCH' | 'PIECE' | 'LITER';
  minimum_order_qty: string;
  harvest_date: string;
  is_preorder?: boolean;
  expected_harvest_date?: string | null;
  peak_season_months?: number[];
  is_organic: boolean;
  is_featured: boolean;
  status: 'DRAFT' | 'ACTIVE' | 'OUT_OF_STOCK' | 'SUSPENDED';
  rating_avg: string;
  rating_count: number;
  primary_image?: string | null;
  thumbnail_url?: string | null;
  medium_image_url?: string | null;
  blur_placeholder?: string;
  images?: ProductImage[];
  inventory?: Inventory;
  available_stock?: string;
  volume_tiers?: VolumeDiscountTier[];
  created_at: string;
  updated_at?: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: string;
  effective_unit_price?: string;
  is_discounted?: boolean;
  subtotal: string;
  created_at: string;
}

export interface FarmerCartGroup {
  farmer_id: string;
  farm_name: string;
  farmer_slug: string;
  province: string;
  is_verified: boolean;
  items: CartItem[];
  subtotal: string;
  delivery_fee: string;
  total: string;
}

export interface SubscriptionItem {
  id: string;
  product: Product;
  quantity: string;
  unit_price: string;
  subtotal: string;
}

export interface Subscription {
  id: string;
  customer: string;
  farmer: FarmerSummary;
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  delivery_day: string;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  delivery_address?: Address | null;
  payment_method: string;
  next_delivery_date: string;
  customer_notes?: string;
  items: SubscriptionItem[];
  estimated_total: string;
  created_at: string;
}

export interface SeasonalMonth {
  month: number;
  name: string;
  season: string;
  focus: string;
  featured_products: Product[];
  total_crops: number;
}

export interface FarmerMapLocation {
  id: string;
  farm_name: string;
  slug: string;
  province: string;
  district: string;
  farming_practice: string;
  rating_avg: string;
  rating_count: number;
  latitude: number | null;
  longitude: number | null;
  bio: string;
  active_crop_count: number;
  sample_crops: Array<{ name: string; price: string; unit: string }>;
  distance_km?: number;
  estimated_delivery_fee?: number;
}

export interface ChatMessage {
  id: string;
  conversation: string;
  sender: string;
  sender_name: string;
  sender_role: string;
  message: string;
  is_read: boolean;
  is_me: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  customer: string;
  customer_name: string;
  farmer: FarmerSummary;
  product?: Product | null;
  subject: string;
  last_message?: ChatMessage | null;
  unread_count: number;
  last_message_at: string;
  created_at: string;
}

export interface BakongPaymentInitiateResponse {
  status: string;
  payment_id: string;
  method: string;
  amount_usd: string;
  amount_khr: string;
  currency: string;
  qr_string: string;
  qr_image: string;
  farmer_qr_url?: string | null;
  bakong_account_id?: string;
  farmer_bank_name?: string;
  farmer_account_name?: string;
  farmer_account_number?: string;
  transaction_id: string;
  signature_hash?: string;
  deep_link: string;
  instructions: string;
  aba_payway_url?: string;
  aba_merchant_id?: string;
  direct_pay_link?: string;
  is_sandbox?: boolean;
}

export interface Cart {
  id: string;
  items: CartItem[];
  total_items: number;
  subtotal: string;
  delivery_fee: string;
  total: string;
  farmer_groups: FarmerCartGroup[];
}

export interface OrderItem {
  id: string;
  product?: string | null;
  product_name_snapshot: string;
  product_image_snapshot: string;
  unit_snapshot: string;
  unit_price_snapshot: string;
  quantity: string;
  subtotal: string;
  has_reviewed?: boolean;
}

export interface Delivery {
  id: string;
  delivery_type: 'FARMER_DIRECT' | 'MARKETPLACE_LOGISTICS' | 'THIRD_PARTY';
  tracking_number?: string;
  driver_name?: string;
  driver_phone?: string;
  estimated_delivery?: string | null;
  actual_delivery?: string | null;
  delivery_notes?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer: string;
  customer_email?: string;
  customer_name?: string;
  farmer: FarmerSummary;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'REJECTED';
  subtotal: string;
  delivery_fee: string;
  commission_rate_percentage?: string;
  marketplace_commission: string;
  farmer_payout?: string;
  total: string;
  delivery_address_snapshot: {
    recipient_name: string;
    phone_number: string;
    province: string;
    district?: string;
    commune?: string;
    street_address: string;
  };
  customer_notes?: string;
  cancellation_reason?: string;
  payment_status: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
  payment_method: 'COD' | 'CREDIT_CARD' | 'BAKONG_QR' | 'BANK_TRANSFER';
  delivery?: Delivery;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  product: string;
  product_name?: string;
  farmer: string;
  farm_name?: string;
  customer: string;
  customer_name?: string;
  customer_avatar?: string | null;
  order_item: string;
  rating: number;
  title: string;
  comment: string;
  image?: string | null;
  is_approved: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: 'ORDER_UPDATE' | 'INVENTORY_ALERT' | 'VERIFICATION' | 'REVIEW' | 'SYSTEM';
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface Favorite {
  id: string;
  product?: Product | null;
  farmer?: FarmerSummary | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface FarmerAnalytics {
  metrics: {
    total_revenue: string;
    monthly_revenue: string;
    total_orders: number;
    pending_orders: number;
    preparing_orders: number;
    delivered_orders: number;
    active_products: number;
    low_stock_products: number;
    rating_avg: string;
    rating_count: number;
  };
  top_products: Array<{
    product_name_snapshot: string;
    unit_snapshot: string;
    total_sold: string;
    total_sales: string;
  }>;
  recent_orders: Order[];
}

export interface AdminAnalytics {
  metrics: {
    total_gmv: string;
    monthly_gmv: string;
    total_commission: string;
    total_orders: number;
    total_users: number;
    total_customers: number;
    total_farmers: number;
    verified_farmers: number;
    pending_verifications: number;
    total_products: number;
    active_products: number;
  };
  top_farmers: Array<{
    id: string;
    farm_name: string;
    province: string;
    is_verified: boolean;
    rating_avg: number;
    total_orders: number;
    total_revenue: string;
  }>;
  recent_orders: Order[];
}

