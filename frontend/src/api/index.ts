import { apiClient } from './client';
import {
  User,
  Category,
  Product,
  ProductImage,
  FarmerProfile,
  FarmerSummary,
  Cart,
  Order,
  Review,
  Notification,
  Favorite,
  Address,
  PaginatedResponse,
  FarmerAnalytics,
  AdminAnalytics,
  Subscription,
  SeasonalMonth,
  FarmerMapLocation,
  Conversation,
  ChatMessage,
  BakongPaymentInitiateResponse,
} from '../types';

export const authApi = {
  register: (data: Record<string, unknown>) =>
    apiClient.post<{ status: string; message: string; requires_verification?: boolean; email?: string; tokens?: { access: string; refresh: string }; user?: User }>('/auth/register/', data),
  login: (data: { email: string; password: string }) =>
    apiClient.post<{ access: string; refresh: string; user: User }>('/auth/login/', data),
  verifyEmail: (data: { uid: string; token: string }) =>
    apiClient.post<{ status: string; message: string; tokens: { access: string; refresh: string }; user: User }>('/auth/verify-email/', data),
  resendVerification: (data: { email: string }) =>
    apiClient.post<{ status: string; message: string }>('/auth/resend-verification/', data),
  googleAuth: (data: { id_token: string }) =>
    apiClient.post<{ status: string; message: string; tokens: { access: string; refresh: string }; user: User }>('/auth/google/', data),
  getMe: () => apiClient.get<User>('/auth/me/'),
  updateProfile: (data: FormData | Record<string, unknown>) =>
    apiClient.patch<User>('/auth/me/', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    }),
};

export const addressesApi = {
  getAddresses: () => apiClient.get<Address[]>('/addresses/'),
  createAddress: (data: Partial<Address>) => apiClient.post<Address>('/addresses/', data),
  updateAddress: (id: string, data: Partial<Address>) => apiClient.patch<Address>(`/addresses/${id}/`, data),
  deleteAddress: (id: string) => apiClient.delete(`/addresses/${id}/`),
};

export const productsApi = {
  getCategories: () => apiClient.get<Category[]>('/categories/'),
  getProducts: (params?: Record<string, string | number | boolean | undefined>) => apiClient.get<PaginatedResponse<Product>>('/products/', { params }),
  getProductBySlug: (slug: string) => apiClient.get<Product>(`/products/${slug}/`),
  getSeasonalCalendar: () => apiClient.get<SeasonalMonth[]>('/products/seasonal-calendar/'),
  
  // Farmer Portal
  getFarmerProducts: () => apiClient.get<PaginatedResponse<Product>>('/farmer/products/'),
  createProduct: (data: FormData) => apiClient.post<Product>('/farmer/products/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateProduct: (id: string, data: FormData) => apiClient.patch<Product>(`/farmer/products/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteProduct: (id: string) => apiClient.delete(`/farmer/products/${id}/`),
  updateInventory: (productId: string, data: { available_quantity: string; low_stock_threshold?: string }) =>
    apiClient.patch(`/farmer/inventory/${productId}/`, data),
  
  // Image Pipeline
  uploadProductImages: (productId: string, formData: FormData) =>
    apiClient.post<{ status: string; images: ProductImage[]; quality_reports: any[] }>(
      `/farmer/products/${productId}/images/`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ),
  deleteProductImage: (productId: string, imageId: string) =>
    apiClient.delete(`/farmer/products/${productId}/images/${imageId}/`),
  setPrimaryProductImage: (productId: string, imageId: string) =>
    apiClient.post(`/farmer/products/${productId}/images/${imageId}/set-primary/`),
};

export const farmersApi = {
  getFarmers: (params?: Record<string, string | number | boolean | undefined>) => apiClient.get<PaginatedResponse<FarmerProfile>>('/farmers/', { params }),
  getFarmerBySlug: (slug: string) => apiClient.get<FarmerProfile>(`/farmers/${slug}/`),
  getMapLocations: () => apiClient.get<FarmerMapLocation[]>('/farmers/map/'),
  getNearbyFarmers: (lat: number, lng: number, radius_km = 50) =>
    apiClient.get<FarmerMapLocation[]>('/farmers/nearby/', { params: { lat, lng, radius_km } }),
  
  // Farmer Portal
  getMyProfile: () => apiClient.get<FarmerProfile>('/farmer/profile/'),
  updateMyProfile: (data: FormData | Partial<FarmerProfile>) => apiClient.patch<FarmerProfile>('/farmer/profile/', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  }),
  submitVerification: (data: FormData) => apiClient.post('/farmer/verification/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  // Admin Portal
  getAdminFarmers: (params?: Record<string, string | number | boolean | undefined>) => apiClient.get<PaginatedResponse<FarmerProfile>>('/admin/farmers/', { params }),
  verifyFarmer: (id: string, action: 'approve' | 'reject', admin_notes?: string) => apiClient.post(`/admin/farmers/${id}/verify/`, { action, admin_notes }),
};

export const cartApi = {
  getCart: () => apiClient.get<Cart>('/cart/'),
  addItem: (productId: string, quantity: number | string) => apiClient.post('/cart/items/', { product_id: productId, quantity }),
  updateItem: (itemId: string, quantity: number | string) => apiClient.patch(`/cart/items/${itemId}/`, { quantity }),
  removeItem: (itemId: string) => apiClient.delete(`/cart/items/${itemId}/`),
  clearCart: () => apiClient.delete('/cart/clear/'),
};

export const ordersApi = {
  checkout: (data: { address_id: string; payment_method: string; customer_notes?: string }) =>
    apiClient.post<{ status: string; message: string; orders: Order[] }>('/orders/checkout/', data),
  getCustomerOrders: (params?: Record<string, string | number | boolean | undefined>) => apiClient.get<PaginatedResponse<Order>>('/orders/', { params }),
  getOrderDetail: (id: string) => apiClient.get<Order>(`/orders/${id}/`),
  cancelOrder: (id: string, reason?: string) => apiClient.post<{ status: string; order: Order }>(`/orders/${id}/cancel/`, { reason }),
  
  // PDF Document Downloads
  getInvoicePdfUrl: (orderId: string) => {
    const token = localStorage.getItem('access_token');
    return `${apiClient.defaults.baseURL}/orders/${orderId}/invoice/${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },
  getPackingSlipPdfUrl: (orderId: string) => {
    const token = localStorage.getItem('access_token');
    return `${apiClient.defaults.baseURL}/orders/${orderId}/packing-slip/${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },
  downloadInvoicePdf: async (orderId: string, orderNumber: string) => {
    const res = await apiClient.get(`/orders/${orderId}/invoice/`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Invoice_${orderNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  downloadPackingSlipPdf: async (orderId: string, orderNumber: string) => {
    const res = await apiClient.get(`/orders/${orderId}/packing-slip/`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PackingSlip_${orderNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  
  // Farmer Portal
  getFarmerOrders: (params?: Record<string, string | number | boolean | undefined>) => apiClient.get<PaginatedResponse<Order>>('/farmer/orders/', { params }),
  updateOrderStatus: (id: string, data: { status: string; driver_name?: string; driver_phone?: string; tracking_number?: string; cancellation_reason?: string }) =>
    apiClient.patch<{ status: string; order: Order }>(`/farmer/orders/${id}/status/`, data),

  // Admin Portal
  getAdminOrders: (params?: Record<string, string | number | boolean | undefined>) => apiClient.get<PaginatedResponse<Order>>('/admin/orders/', { params }),
};

export const paymentsApi = {
  initiatePayment: (orderId: string, currency: 'USD' | 'KHR' = 'USD', paymentMethod = 'BAKONG_QR') =>
    apiClient.post<BakongPaymentInitiateResponse>(`/payments/${orderId}/initiate/`, { currency, payment_method: paymentMethod }),
  verifyPayment: (orderId: string) =>
    apiClient.post<{ status: string; payment_status: string; order_status: string }>(`/payments/${orderId}/verify/`),
  simulateSuccess: (orderId: string) =>
    apiClient.post<{ status: string; message: string; payment_status: string; order_status: string }>(`/payments/${orderId}/simulate-success/`),
};

export const subscriptionsApi = {
  getSubscriptions: () => apiClient.get<Subscription[]>('/subscriptions/'),
  createSubscription: (data: {
    farmer_id: string;
    frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
    delivery_day: string;
    address_id: string;
    payment_method: string;
    items: Array<{ product_id: string; quantity: number | string }>;
    customer_notes?: string;
  }) => apiClient.post<Subscription>('/subscriptions/', data),
  updateSubscriptionStatus: (id: string, status: 'ACTIVE' | 'PAUSED' | 'CANCELLED') =>
    apiClient.patch<Subscription>(`/subscriptions/${id}/`, { status }),
};

export const inquiriesApi = {
  getConversations: () => apiClient.get<Conversation[]>('/conversations/'),
  getConversationMessages: (id: string) =>
    apiClient.get<{ conversation: Conversation; messages: ChatMessage[] }>(`/conversations/${id}/`),
  sendMessage: (conversationId: string, message: string) =>
    apiClient.post<ChatMessage>(`/conversations/${conversationId}/`, { message }),
  startConversation: (data: { farmer_id?: string; product_id?: string; message: string; subject?: string }) =>
    apiClient.post<{ status: string; conversation_id: string; message: ChatMessage }>('/conversations/start/', data),
};

export const reviewsApi = {
  getProductReviews: (productId: string) => apiClient.get<PaginatedResponse<Review>>(`/reviews/product/${productId}/`),
  getFarmerReviews: (farmerId: string) => apiClient.get<PaginatedResponse<Review>>(`/reviews/farmer/${farmerId}/`),
  createReview: (data: FormData | { order_item_id: string; rating: number; title: string; comment: string }) =>
    apiClient.post<{ status: string; message: string; review: Review }>('/reviews/', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    }),
  getAdminReviews: (params?: Record<string, string | number | boolean | undefined>) => apiClient.get<PaginatedResponse<Review>>('/admin/reviews/', { params }),
  moderateReview: (id: string, is_approved: boolean) => apiClient.patch(`/admin/reviews/${id}/moderate/`, { is_approved }),
};

export const notificationsApi = {
  getNotifications: () => apiClient.get<PaginatedResponse<Notification>>('/notifications/'),
  markAsRead: (id: string) => apiClient.patch(`/notifications/${id}/read/`),
  markAllAsRead: () => apiClient.post('/notifications/mark-all-read/'),
};

export const favoritesApi = {
  getFavorites: () => apiClient.get<PaginatedResponse<Favorite>>('/favorites/'),
  toggleFavorite: (data: { product_id?: string; farmer_id?: string }) => apiClient.post<{ status: string; favorited: boolean; message: string }>('/favorites/toggle/', data),
};

export const analyticsApi = {
  getFarmerAnalytics: () => apiClient.get<FarmerAnalytics>('/farmer/dashboard/'),
  getFarmerCustomers: () => apiClient.get<Array<{ customer__id: string; customer__username: string; customer__email: string; customer__phone_number: string; order_count: number; total_spent: string }>>('/farmer/customers/'),
  getAdminAnalytics: () => apiClient.get<AdminAnalytics>('/admin/dashboard/'),
};

export const aiApi = {
  smartSearch: (q: string) =>
    apiClient.get<{
      query: string;
      parsed_intent: {
        category_slug: string | null;
        province: string | null;
        is_organic: boolean | null;
        max_price: number | null;
        keywords: string[];
        explanation: string[];
      };
      count: number;
      results: Product[];
    }>('/ai/smart-search/', { params: { q } }),

  generateDescription: (data: {
    crop_name: string;
    bullet_points: string;
    farming_practice?: string;
    province?: string;
  }) =>
    apiClient.post<{
      short_description: string;
      full_description: string;
      suggested_tags: string[];
    }>('/ai/generate-description/', data),

  checkImageQuality: (formData: FormData) =>
    apiClient.post<{
      is_good_quality: boolean;
      brightness_score: number;
      sharpness_score: number;
      dimensions: { width: number; height: number };
      issues: string[];
    }>('/ai/check-image-quality/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getProductRecommendations: (productId: string) =>
    apiClient.get<Product[]>('/ai/recommendations/', { params: { product_id: productId } }),

  getForYouRecommendations: () => apiClient.get<Product[]>('/ai/for-you/'),

  getHarvestForecast: () =>
    apiClient.get<{
      period: string;
      forecast: Array<{
        product_id: string;
        product_name: string;
        category: string;
        unit: string;
        current_stock: string;
        projected_weekly_demand: string;
        demand_trend: 'HIGH' | 'STABLE';
        projected_growth_percentage: string;
        recommendation: string;
      }>;
    }>('/ai/harvest-forecast/'),

  diagnoseCrop: (formData: FormData | { crop_name: string; notes: string }) =>
    apiClient.post<{
      scan_id: string;
      timestamp: string;
      crop_analyzed: string;
      health_score: number;
      summary_verdict: string;
      diagnosis: {
        id: string;
        name: string;
        crop_targets: string[];
        disease_type: string;
        severity: string;
        confidence: number;
        affected_parts: string[];
        visual_symptoms: string;
        root_cause: string;
        why_produce_spoiled: string;
        immediate_actions: string[];
        organic_remedies: string[];
        prevention_and_storage_tips: string[];
      };
    }>('/ai/diagnose-crop/', formData, {
      headers: formData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    }),

  getAgriWeather: (province = 'Siem Reap') =>
    apiClient.get<{
      province: string;
      soil_profile: string;
      elevation_profile: string;
      generated_at: string;
      current_day: any;
      weekly_forecast: Array<{
        day_index: number;
        date: string;
        day_name: string;
        condition_label: string;
        condition_type: string;
        icon: string;
        temp_high: number;
        temp_low: number;
        rain_probability: number;
        rain_amount_mm: number;
        humidity_percent: number;
        uv_index: number;
        wind_speed_kmh: number;
        soil_moisture: string;
      }>;
      agri_advisories: Array<{
        level: 'WARNING' | 'ADVISORY' | 'INFO';
        title: string;
        action: string;
      }>;
    }>('/ai/agri-weather/', { params: { province } }),

  getMarketPrices: (params?: { category?: string; province?: string }) =>
    apiClient.get<{
      provinces_tracked: string[];
      user_province: string;
      commodities: Array<{
        commodity: string;
        category: string;
        unit: string;
        base_price: number;
        prices: Record<string, { price: number; change_7d: number; trend: string; demand: string }>;
        reason: string;
      }>;
      top_price_surges: Array<{
        commodity: string;
        category: string;
        province: string;
        price: number;
        unit: string;
        change_7d: number;
        trend: string;
        demand: string;
        reason: string;
      }>;
      top_price_drops: Array<{
        commodity: string;
        category: string;
        province: string;
        price: number;
        unit: string;
        change_7d: number;
        trend: string;
        demand: string;
        reason: string;
      }>;
      farmer_arbitrage_opportunities: Array<{
        commodity: string;
        unit: string;
        origin_province: string;
        origin_price: number;
        target_province: string;
        target_price: number;
        margin_gain_per_unit: number;
        percentage_gain: string;
        tip: string;
      }>;
      last_updated: string;
    }>('/ai/market-prices/', { params }),
};
