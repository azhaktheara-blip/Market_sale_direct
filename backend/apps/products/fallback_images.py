"""
Produce photo fallbacks for agricultural products in the marketplace.
Ensures products without uploaded images or with ephemeral media storage
still present high-converting, professional produce imagery.
"""

PRODUCE_KEYWORD_IMAGES = [
    # Tomatoes
    (['tomato', 'tomatos', 'tomatoes', 'pomodoro'], 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80'),
    # Oranges / Citrus
    (['orange', 'oragines', 'oranges', 'mandarin', 'tangerine'], 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=800&q=80'),
    (['citrus', 'lime', 'limes', 'lemon', 'lemons'], 'https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=800&q=80'),
    (['pomelo', 'grapefruit'], 'https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?auto=format&fit=crop&w=800&q=80'),
    # Cucumbers
    (['cucumber', 'cucumbers', 'gherkin'], 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=800&q=80'),
    # Beans
    (['bean', 'beans', 'yardlong', 'green bean'], 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=800&q=80'),
    # Greens / Spinach / Morning Glory / Bok Choy / Kale / Lettuce
    (['morning glory', 'trakoun', 'water spinach', 'spinach'], 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80'),
    (['bok choy', 'pak choi', 'cabbage'], 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'),
    (['kale', 'collard'], 'https://images.unsplash.com/photo-1524179091875-bf99a9a6fa57?auto=format&fit=crop&w=800&q=80'),
    (['lettuce', 'salad', 'butterhead'], 'https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?auto=format&fit=crop&w=800&q=80'),
    # Eggplants
    (['eggplant', 'eggplants', 'aubergine', 'brinjal'], 'https://images.unsplash.com/photo-1628773822503-930a84d9f187?auto=format&fit=crop&w=800&q=80'),
    # Pumpkin / Squash
    (['pumpkin', 'squash', 'gourd'], 'https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc?auto=format&fit=crop&w=800&q=80'),
    # Rice & Grains
    (['rice', 'jasmine', 'phka rumduol', 'sticky rice', 'paddy', 'grain'], 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80'),
    # Spices: Pepper
    (['pepper', 'peppercorn', 'kampot pepper', 'peppercorns'], 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=800&q=80'),
    # Chili
    (['chili', 'chilies', 'chilli', 'birdseye'], 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=800&q=80'),
    # Herbs: Lemongrass & Basil
    (['lemongrass', 'herbs', 'herb'], 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80'),
    (['basil', 'holy basil', 'mint'], 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=800&q=80'),
    # Roots: Turmeric & Ginger & Galangal & Lotus
    (['turmeric', 'curcumin'], 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80'),
    (['ginger', 'galangal', 'kah', 'root'], 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80'),
    (['lotus', 'lotus root', 'lotus seed'], 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80'),
    # Tropical Fruits: Dragon Fruit
    (['dragon fruit', 'pitaya', 'red dragon'], 'https://images.unsplash.com/photo-1527325678964-54921661f888?auto=format&fit=crop&w=800&q=80'),
    # Mango
    (['mango', 'mangoes', 'keo romeat'], 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80'),
    # Watermelon
    (['watermelon', 'melon'], 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80'),
    # Papaya
    (['papaya', 'pawpaw'], 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=800&q=80'),
    # Banana
    (['banana', 'bananas', 'namwa'], 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80'),
    # Coconut
    (['coconut', 'coconuts', 'coconut oil'], 'https://images.unsplash.com/photo-1544378730-8b5104b18790?auto=format&fit=crop&w=800&q=80'),
    # Passion Fruit
    (['passion fruit', 'passionfruit'], 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&w=800&q=80'),
    # Raw Sugar & Artisanal
    (['sugar', 'palm sugar', 'raw sugar', 'sugar palm', 'sweetener'], 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=800&q=80'),
    # Honey
    (['honey', 'wild honey', 'raw honey'], 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=800&q=80'),
    # Coffee & Cacao
    (['coffee', 'arabica', 'beans', 'cascara'], 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80'),
    (['cacao', 'cocoa', 'chocolate'], 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=800&q=80'),
    # Eggs
    (['egg', 'eggs', 'duck egg', 'duck eggs', 'hen egg'], 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=800&q=80'),
]

CATEGORY_FALLBACK_IMAGES = {
    'fresh-vegetables': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    'tropical-fruits': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=80',
    'grains-rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
    'herbs-spices': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
    'dairy-eggs': 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=800&q=80',
    'artisanal-processed': 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=800&q=80',
}

DEFAULT_PRODUCE_IMAGE = 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=800&q=80'


def get_fallback_produce_image(product_name: str = '', category_slug: str = '') -> str:
    norm_name = (product_name or '').lower().strip()
    if norm_name:
        for keywords, url in PRODUCE_KEYWORD_IMAGES:
            for kw in keywords:
                if kw in norm_name:
                    return url

    norm_cat = (category_slug or '').lower().strip()
    if norm_cat:
        for slug, url in CATEGORY_FALLBACK_IMAGES.items():
            if slug in norm_cat or norm_cat in slug:
                return url

    return DEFAULT_PRODUCE_IMAGE

