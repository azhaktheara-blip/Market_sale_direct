/**
 * Media and produce image resolution utilities.
 * Handles:
 * 1. Resolving relative Django /media/ URLs to absolute backend URLs across Vercel & Render
 * 2. High-quality produce photo fallbacks for items without uploaded photos or when media 404s
 */

export const getBackendBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
  }
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return 'https://farmer-direct-backend.onrender.com';
  }
  return 'http://localhost:8000';
};

/**
 * Resolves any media URL. If it's a relative path like /media/...,
 * prepends the backend origin so it doesn't 404 on Vercel.
 */
export const resolveMediaUrl = (url?: string | null): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  const baseUrl = getBackendBaseUrl();
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * High-definition, verified produce photographs from Unsplash CDN
 * tailored specifically for agricultural products in the marketplace catalog.
 */
export const PRODUCE_KEYWORD_IMAGES: Array<{ keywords: string[]; url: string }> = [
  // Tomatoes
  {
    keywords: ['tomato', 'tomatos', 'tomatoes', 'pomodoro'],
    url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
  },
  // Oranges / Citrus
  {
    keywords: ['orange', 'oragines', 'oranges', 'mandarin', 'tangerine'],
    url: 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['citrus', 'lime', 'limes', 'lemon', 'lemons'],
    url: 'https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['pomelo', 'grapefruit'],
    url: 'https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?auto=format&fit=crop&w=800&q=80',
  },
  // Cucumbers
  {
    keywords: ['cucumber', 'cucumbers', 'gherkin'],
    url: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=800&q=80',
  },
  // Beans
  {
    keywords: ['bean', 'beans', 'yardlong', 'green bean'],
    url: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=800&q=80',
  },
  // Greens / Spinach / Morning Glory / Bok Choy / Kale / Lettuce
  {
    keywords: ['morning glory', 'trakoun', 'water spinach', 'spinach'],
    url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['bok choy', 'pak choi', 'cabbage'],
    url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['kale', 'collard'],
    url: 'https://images.unsplash.com/photo-1524179091875-bf99a9a6fa57?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['lettuce', 'salad', 'butterhead'],
    url: 'https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?auto=format&fit=crop&w=800&q=80',
  },
  // Eggplants
  {
    keywords: ['eggplant', 'eggplants', 'aubergine', 'brinjal'],
    url: 'https://images.unsplash.com/photo-1628773822503-930a84d9f187?auto=format&fit=crop&w=800&q=80',
  },
  // Pumpkin / Squash
  {
    keywords: ['pumpkin', 'squash', 'gourd'],
    url: 'https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc?auto=format&fit=crop&w=800&q=80',
  },
  // Rice & Grains
  {
    keywords: ['rice', 'jasmine', 'phka rumduol', 'sticky rice', 'paddy', 'grain'],
    url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
  },
  // Spices: Pepper
  {
    keywords: ['pepper', 'peppercorn', 'kampot pepper', 'peppercorns'],
    url: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=800&q=80',
  },
  // Chili
  {
    keywords: ['chili', 'chilies', 'chilli', 'birdseye', 'pepper'],
    url: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=800&q=80',
  },
  // Herbs: Lemongrass & Basil
  {
    keywords: ['lemongrass', 'herbs', 'herb'],
    url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['basil', 'holy basil', 'mint'],
    url: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=800&q=80',
  },
  // Roots: Turmeric & Ginger & Galangal & Lotus
  {
    keywords: ['turmeric', 'curcumin'],
    url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['ginger', 'galangal', 'kah', 'root'],
    url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['lotus', 'lotus root', 'lotus seed'],
    url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
  },
  // Tropical Fruits: Dragon Fruit
  {
    keywords: ['dragon fruit', 'pitaya', 'red dragon'],
    url: 'https://images.unsplash.com/photo-1527325678964-54921661f888?auto=format&fit=crop&w=800&q=80',
  },
  // Mango
  {
    keywords: ['mango', 'mangoes', 'keo romeat'],
    url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80',
  },
  // Watermelon
  {
    keywords: ['watermelon', 'melon'],
    url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80',
  },
  // Papaya
  {
    keywords: ['papaya', 'pawpaw'],
    url: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=800&q=80',
  },
  // Banana
  {
    keywords: ['banana', 'bananas', 'namwa'],
    url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80',
  },
  // Coconut
  {
    keywords: ['coconut', 'coconuts', 'coconut oil'],
    url: 'https://images.unsplash.com/photo-1544378730-8b5104b18790?auto=format&fit=crop&w=800&q=80',
  },
  // Passion Fruit
  {
    keywords: ['passion fruit', 'passionfruit'],
    url: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&w=800&q=80',
  },
  // Raw Sugar & Artisanal
  {
    keywords: ['sugar', 'palm sugar', 'raw sugar', 'sugar palm', 'sweetener'],
    url: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=800&q=80',
  },
  // Honey
  {
    keywords: ['honey', 'wild honey', 'raw honey'],
    url: 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=800&q=80',
  },
  // Coffee & Cacao
  {
    keywords: ['coffee', 'arabica', 'beans', 'cascara'],
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['cacao', 'cocoa', 'chocolate'],
    url: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=800&q=80',
  },
  // Eggs
  {
    keywords: ['egg', 'eggs', 'duck egg', 'duck eggs', 'hen egg'],
    url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=800&q=80',
  },
];

export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  'fresh-vegetables': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  'tropical-fruits': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=80',
  'grains-rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
  'herbs-spices': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
  'dairy-eggs': 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=800&q=80',
  'artisanal-processed': 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=800&q=80',
};

export const DEFAULT_PRODUCE_IMAGE =
  'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=800&q=80';

/**
 * Returns a matching produce photo based on the product's name and category.
 */
export const getProduceFallbackImage = (productName?: string, categorySlugOrName?: string): string => {
  const normName = (productName || '').toLowerCase().trim();

  // 1. Keyword match on product name
  if (normName) {
    for (const entry of PRODUCE_KEYWORD_IMAGES) {
      for (const kw of entry.keywords) {
        if (normName.includes(kw)) {
          return entry.url;
        }
      }
    }
  }

  // 2. Category slug / name match
  const normCat = (categorySlugOrName || '').toLowerCase().trim();
  if (normCat) {
    for (const [slug, url] of Object.entries(CATEGORY_FALLBACK_IMAGES)) {
      if (normCat.includes(slug) || slug.replace('-', ' ').includes(normCat) || normCat.includes(slug.replace('-', ' '))) {
        return url;
      }
    }
  }

  return DEFAULT_PRODUCE_IMAGE;
};

/**
 * Convenience helper to extract the best resolved image URL for any Product object.
 */
export const getProductImage = (
  product?: {
    name?: string;
    primary_image?: string | null;
    medium_image_url?: string | null;
    thumbnail_url?: string | null;
    category?: any;
    category_name?: string;
  } | null,
  preferredSize: 'thumb' | 'medium' | 'full' = 'full'
): string => {
  if (!product) return DEFAULT_PRODUCE_IMAGE;

  let candidate: string | null | undefined = null;
  if (preferredSize === 'thumb') {
    candidate = product.thumbnail_url || product.medium_image_url || product.primary_image;
  } else if (preferredSize === 'medium') {
    candidate = product.medium_image_url || product.primary_image || product.thumbnail_url;
  } else {
    candidate = product.primary_image || product.medium_image_url || product.thumbnail_url;
  }

  const resolved = resolveMediaUrl(candidate);
  if (resolved) return resolved;

  const cat =
    product.category_name ||
    (typeof product.category === 'object' ? product.category?.slug || product.category?.name : product.category);
  return getProduceFallbackImage(product.name, cat);
};
