import random
from decimal import Decimal
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db import transaction

from apps.accounts.models import CustomerProfile, Address
from apps.farmers.models import FarmerProfile
from apps.products.models import Category, Product, Inventory
from apps.orders.models import Order, OrderItem, Delivery
from apps.payments.models import Payment
from apps.reviews.models import Review

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds realistic development marketplace data with 10+ farmers, 50+ products, categories, orders, and reviews.'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Seeding Farmer-Direct Marketplace database...")

        # 1. Create Platform Admin
        admin_user, _ = User.objects.get_or_create(
            email='admin@farmerdirect.com',
            defaults={
                'username': 'admin',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.set_password('admin123456')
        admin_user.save()
        self.stdout.write(self.style.SUCCESS("[OK] Admin created: admin@farmerdirect.com / admin123456"))

        theara_admin, _ = User.objects.get_or_create(
            email='kraitheara168@gmail.com',
            defaults={
                'username': 'kraitheara168',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'email_verified': True,
            }
        )
        theara_admin.set_password('Theara@@@96')
        theara_admin.is_staff = True
        theara_admin.is_superuser = True
        theara_admin.role = User.Role.ADMIN
        theara_admin.email_verified = True
        theara_admin.save()
        self.stdout.write(self.style.SUCCESS(f"[OK] Superuser created: kraitheara168@gmail.com / Theara@@@96 (Account ID: {theara_admin.account_id})"))


        # 2. Create Categories
        categories_data = [
            {'name': 'Fresh Vegetables', 'slug': 'fresh-vegetables', 'icon': 'Carrot', 'display_order': 1, 'description': 'Crisp, organically grown leafy greens, roots, and culinary vegetables harvested daily.'},
            {'name': 'Tropical Fruits', 'slug': 'tropical-fruits', 'icon': 'Apple', 'display_order': 2, 'description': 'Sun-ripened seasonal mangoes, dragon fruits, watermelons, and citrus.'},
            {'name': 'Grains & Rice', 'slug': 'grains-rice', 'icon': 'Wheat', 'display_order': 3, 'description': 'Award-winning fragrant Jasmine rice, sticky rice, and heritage whole grains.'},
            {'name': 'Herbs & Spices', 'slug': 'herbs-spices', 'icon': 'Leaf', 'display_order': 4, 'description': 'Aromatic lemongrass, authentic Kampot pepper, ginger, galangal, and fresh chilies.'},
            {'name': 'Farm Dairy & Eggs', 'slug': 'dairy-eggs', 'icon': 'Egg', 'display_order': 5, 'description': 'Freshly gathered free-range pasture eggs and raw honey.'},
            {'name': 'Artisanal & Processed', 'slug': 'artisanal-processed', 'icon': 'Jar', 'display_order': 6, 'description': 'Farm-pressed virgin coconut oil, dried mango snacks, and natural preserves.'},
        ]

        categories = {}
        for cdata in categories_data:
            cat, _ = Category.objects.update_or_create(slug=cdata['slug'], defaults=cdata)
            categories[cdata['slug']] = cat
        self.stdout.write(self.style.SUCCESS(f"[OK] Created {len(categories)} product categories."))

        # 3. Create Farmers (10 diverse farms across Cambodia)
        farmers_data = [
            {
                'email': 'sokha.farm@farmerdirect.com', 'username': 'sokha_farm', 'name': 'Sokha Green Organic Farm',
                'province': 'Siem Reap', 'district': 'Bakong', 'commune': 'Prasat Bakong', 'address': 'Phum Roluos, National Road 6',
                'practice': FarmerProfile.FarmingPractice.ORGANIC, 'years': 12, 'is_verified': True,
                'phone': '+855 12 888 101',
                'bio': 'Pioneering regenerative organic agriculture and permaculture in the Angkor heritage plains.',
                'story': 'Sokha Farm was founded in 2014 by Sokha and his family with a clear mission: restoring ancient agricultural soil vitality using traditional composting, nitrogen-fixing companion plants, and zero synthetic pesticides. We supply organic vegetables to top Siem Reap farm-to-table dining establishments.'
            },
            {
                'email': 'battambang.rice@farmerdirect.com', 'username': 'battambang_paddy', 'name': 'Battambang Heritage Rice Estate',
                'province': 'Battambang', 'district': 'Bavel', 'commune': 'Prey Khpos', 'address': 'Paddy Sector 4, Sangke Basin',
                'practice': FarmerProfile.FarmingPractice.REGENERATIVE, 'years': 25, 'is_verified': True,
                'phone': '+855 12 888 102',
                'bio': 'World-renowned fragrant Phka Rumduol Jasmine rice cultivated along the fertile floodplains of Tonle Sap.',
                'story': 'Three generations of heritage rice masters harvesting natural rain-fed Jasmine rice. Our grain drying and milling processes retain complete nutrient profiles and natural floral aroma that has won international gold standards.'
            },
            {
                'email': 'kampot.pepper@farmerdirect.com', 'username': 'kampot_plantation', 'name': 'Kampot Sunlit Spice Plantation',
                'province': 'Kampot', 'district': 'Tuek Chhou', 'commune': 'Prek Thnaot', 'address': 'Bokor Foothills Valley',
                'practice': FarmerProfile.FarmingPractice.ORGANIC, 'years': 18, 'is_verified': True,
                'phone': '+855 12 888 103',
                'bio': 'Protected Geographical Indication (PGI) certified Kampot black, red, and white whole peppercorns.',
                'story': 'Nestled between the Bokor mountains and the Gulf of Thailand, our mineral-dense quartz soils and ocean breeze yield the world’s most aromatic and complex gourmet pepper.'
            },
            {
                'email': 'kandal.greens@farmerdirect.com', 'username': 'kandal_hydro', 'name': 'Kandal River Hydro & Clean Greens',
                'province': 'Kandal', 'district': 'Saang', 'commune': 'Koh Thom', 'address': 'Bassac River Bank Rd',
                'practice': FarmerProfile.FarmingPractice.HYDROPONIC, 'years': 8, 'is_verified': True,
                'phone': '+855 12 888 104',
                'bio': 'Precision climate-controlled greenhouses producing ultra-clean, pesticide-free salad greens and herbs.',
                'story': 'Using 80% less water than open field farming, our state-of-the-art clean greenhouses harvest crisp lettuce, bok choy, and kale within 3 hours of customer dispatch.'
            },
            {
                'email': 'kohkong.orchard@farmerdirect.com', 'username': 'kohkong_fruit', 'name': 'Cardamom Coastal Fruit Orchard',
                'province': 'Koh Kong', 'district': 'Mondol Seima', 'commune': 'Pak Khlang', 'address': 'Coastal Valley Km 14',
                'practice': FarmerProfile.FarmingPractice.PERMACULTURE, 'years': 15, 'is_verified': True,
                'phone': '+855 12 888 105',
                'bio': 'Tropical fruit agroforestry cultivating premium red dragon fruit, sweet mangoes, and durian.',
                'story': 'Our 20-hectare agroforest grows alongside natural Cardamom mountain stream corridors, providing lush biodiversity where birds and bees naturally pollinate our fruit trees.'
            },
            {
                'email': 'pursat.citrus@farmerdirect.com', 'username': 'pursat_oranges', 'name': 'Pursat Golden Citrus Groves',
                'province': 'Pursat', 'district': 'Bakan', 'commune': 'Khnar Totueng', 'address': 'National Highway 5 East',
                'practice': FarmerProfile.FarmingPractice.CONVENTIONAL, 'years': 20, 'is_verified': True,
                'phone': '+855 12 888 106',
                'bio': 'Authentic Pursat sweet green oranges, pomelos, and citrus famous for high natural vitamin C.',
                'story': 'Deep alluvial clay soils along the Pursat River produce our celebrated sweet green-skin oranges, renowned across Southeast Asia for their unique sweet-tart balancing flavor.'
            },
            {
                'email': 'mondulkiri.coffee@farmerdirect.com', 'username': 'highland_farms', 'name': 'Mondulkiri Highland Agro-Farms',
                'province': 'Mondulkiri', 'district': 'Sen Monorom', 'commune': 'Rom Monea', 'address': 'Highland Ridge 800m',
                'practice': FarmerProfile.FarmingPractice.ORGANIC, 'years': 10, 'is_verified': True,
                'phone': '+855 12 888 107',
                'bio': 'Cool altitude wild honey, shade-grown Arabica coffee, and organic mountain passion fruit.',
                'story': 'Perched 800 meters above sea level in the temperate highlands, our collective works with indigenous Bunong forest communities to sustainably harvest wild honey and organic crops.'
            },
            {
                'email': 'takeo.aquafarm@farmerdirect.com', 'username': 'takeo_pastures', 'name': 'Takeo Free-Range Valley',
                'province': 'Takeo', 'district': 'Angkor Borei', 'commune': 'Prek Pnov', 'address': 'Canal 15 Waterside',
                'practice': FarmerProfile.FarmingPractice.PERMACULTURE, 'years': 14, 'is_verified': True,
                'phone': '+855 12 888 108',
                'bio': 'Pasture-raised free-range poultry eggs and organic heritage lotus root.',
                'story': 'Our heritage ducks and hens roam freely in wetland paddies eating natural insects, grains, and greens, producing dark orange egg yolks rich in omega-3.'
            },
            {
                'email': 'kampongcham.banana@farmerdirect.com', 'username': 'mekong_islands', 'name': 'Mekong Island Banana & Cacao',
                'province': 'Kampong Cham', 'district': 'Koh Sotin', 'commune': 'Moha Leap', 'address': 'Koh Sotin Silk Island',
                'practice': FarmerProfile.FarmingPractice.ORGANIC, 'years': 16, 'is_verified': True,
                'phone': '+855 12 888 109',
                'bio': 'Rich Mekong silt-fed island farm growing Namwa bananas, papaya, and organic cacao.',
                'story': 'Every monsoon season, the Mekong River deposits mineral-rich natural silt over our island fields, eliminating any need for chemical fertilizers.'
            },
            {
                'email': 'kratie.pomelo@farmerdirect.com', 'username': 'kratie_dolphins', 'name': 'Kratie Dolphin Coast Pomelo Farm',
                'province': 'Kratie', 'district': 'Chhlong', 'commune': 'Prek Samrong', 'address': 'River Road 73',
                'practice': FarmerProfile.FarmingPractice.ORGANIC, 'years': 22, 'is_verified': True,
                'phone': '+855 12 888 110',
                'bio': 'Koh Trong Island sweet seedless pomelos and organic fresh ginger roots.',
                'story': 'Grown on the tranquil eco-island of Koh Trong in the middle of the Mekong, our pomelos are awarded national heritage status for their crisp sweet juice and seedless perfection.'
            }
        ]

        farmer_profiles = []
        for fdata in farmers_data:
            user, _ = User.objects.get_or_create(
                email=fdata['email'],
                defaults={'username': fdata['username'], 'role': User.Role.FARMER, 'phone_number': fdata['phone']}
            )
            user.set_password('farmer123456')
            user.save()

            profile, _ = FarmerProfile.objects.update_or_create(
                user=user,
                defaults={
                    'farm_name': fdata['name'],
                    'province': fdata['province'],
                    'district': fdata['district'],
                    'commune': fdata['commune'],
                    'address_line': fdata['address'],
                    'farming_practice': fdata['practice'],
                    'years_of_experience': fdata['years'],
                    'bio': fdata['bio'],
                    'story': fdata['story'],
                    'phone_number': fdata['phone'],
                    'is_verified': fdata['is_verified'],
                    'verification_status': FarmerProfile.VerificationStatus.APPROVED if fdata['is_verified'] else FarmerProfile.VerificationStatus.PENDING,
                }
            )
            farmer_profiles.append(profile)

        self.stdout.write(self.style.SUCCESS(f"[OK] Created {len(farmer_profiles)} verified farmer profiles."))

        # 4. Create 5 Customers
        customers_data = [
            {'email': 'customer@example.com', 'name': 'Dara Som', 'phone': '+855 92 111 222', 'type': CustomerProfile.BusinessType.INDIVIDUAL},
            {'email': 'chef.chan@haven-restaurant.com', 'name': 'Chef Chanroth', 'phone': '+855 93 333 444', 'type': CustomerProfile.BusinessType.RESTAURANT},
            {'email': 'sothea.hotel@angkorpalace.com', 'name': 'Sothea Resort Procurement', 'phone': '+855 95 555 666', 'type': CustomerProfile.BusinessType.HOTEL},
            {'email': 'bopha.grocery@phnompenh.com', 'name': 'Bopha Fresh Mart', 'phone': '+855 96 777 888', 'type': CustomerProfile.BusinessType.LOCAL_STORE},
            {'email': 'ratha.buyer@gmail.com', 'name': 'Ratha Meng', 'phone': '+855 97 999 000', 'type': CustomerProfile.BusinessType.INDIVIDUAL},
        ]

        customer_users = []
        for cdata in customers_data:
            user, _ = User.objects.get_or_create(
                email=cdata['email'],
                defaults={'username': cdata['name'].replace(' ', '_').lower(), 'role': User.Role.CUSTOMER, 'phone_number': cdata['phone']}
            )
            user.set_password('customer123456')
            user.save()

            CustomerProfile.objects.update_or_create(
                user=user,
                defaults={'business_name': cdata['name'], 'business_type': cdata['type']}
            )

            # Create default address
            Address.objects.update_or_create(
                user=user,
                is_default=True,
                defaults={
                    'label': 'Main Delivery Entrance',
                    'recipient_name': cdata['name'],
                    'phone_number': cdata['phone'],
                    'province': 'Siem Reap' if 'hotel' in cdata['email'] else 'Phnom Penh',
                    'district': 'Chamkar Mon',
                    'street_address': 'Street 240, House #18B',
                }
            )
            customer_users.append(user)

        self.stdout.write(self.style.SUCCESS(f"[OK] Created {len(customer_users)} active customer accounts."))

        # 5. Create 50+ Real Agricultural Products with Inventory
        today = timezone.now().date()
        products_catalog = [
            # Sokha Green Organic Farm (Siem Reap)
            ('Organic Siem Reap Vine Tomatoes', 'fresh-vegetables', 'sokha.farm@farmerdirect.com', Decimal('2.40'), Product.Unit.KG, Decimal('2.00'), today, True, True, 180, 'Sun-sweetened heirloom vine tomatoes packed with rich lycopene and intense floral aroma.'),
            ('Crisp Hydroponic Baby Cucumbers', 'fresh-vegetables', 'sokha.farm@farmerdirect.com', Decimal('1.80'), Product.Unit.KG, Decimal('1.00'), today, True, False, 120, 'Extra crunchy and seedless snack cucumbers with thin tender skins.'),
            ('Organic Long Green Beans', 'fresh-vegetables', 'sokha.farm@farmerdirect.com', Decimal('1.90'), Product.Unit.KG, Decimal('1.00'), today - timedelta(days=1), True, False, 90, 'Tender Cambodian yardlong beans, harvested before sunrise for peak crispness.'),
            ('Siem Reap Fresh Morning Glory (Trakoun)', 'fresh-vegetables', 'sokha.farm@farmerdirect.com', Decimal('0.90'), Product.Unit.BUNCH, Decimal('2.00'), today, True, True, 250, 'Organically cultivated water spinach, clean stems with zero sediment.'),
            ('Purple Mini Eggplants', 'fresh-vegetables', 'sokha.farm@farmerdirect.com', Decimal('1.60'), Product.Unit.KG, Decimal('1.00'), today, True, False, 110, 'Sweet round purple eggplants perfect for green curry and stir-fries.'),
            ('Organic Golden Pumpkin', 'fresh-vegetables', 'sokha.farm@farmerdirect.com', Decimal('1.20'), Product.Unit.KG, Decimal('3.00'), today - timedelta(days=3), True, False, 300, 'Dense, naturally buttery pumpkin with vibrant orange flesh.'),

            # Battambang Heritage Rice Estate
            ('Premium Phka Rumduol Jasmine Rice (5kg Bag)', 'grains-rice', 'battambang.rice@farmerdirect.com', Decimal('7.50'), Product.Unit.BOX, Decimal('1.00'), today - timedelta(days=10), True, True, 200, 'World champion aromatic long-grain Jasmine rice, freshly milled and vacuum sealed.'),
            ('Heritage Organic Brown Rice (2kg Bag)', 'grains-rice', 'battambang.rice@farmerdirect.com', Decimal('4.20'), Product.Unit.BOX, Decimal('1.00'), today - timedelta(days=12), True, False, 150, 'High-fiber whole grain brown rice containing natural bran oil and nutty taste.'),
            ('Battambang Sweet Sticky Rice (Glutinous)', 'grains-rice', 'battambang.rice@farmerdirect.com', Decimal('1.80'), Product.Unit.KG, Decimal('2.00'), today - timedelta(days=15), True, False, 350, 'Traditional white glutinous rice ideal for sticky rice with mango and savory cakes.'),
            ('Organic Black Heritage Rice (Neang Khon)', 'grains-rice', 'battambang.rice@farmerdirect.com', Decimal('5.00'), Product.Unit.KG, Decimal('1.00'), today - timedelta(days=8), True, True, 80, 'Deep purple antioxidant-rich forbidden rice with high anthocyanin content.'),
            ('Bulk Premium Jasmine Rice (25kg Sack)', 'grains-rice', 'battambang.rice@farmerdirect.com', Decimal('32.00'), Product.Unit.BOX, Decimal('1.00'), today - timedelta(days=5), True, False, 60, 'Commercial wholesale 25kg packaging tailored for restaurants, cafes, and catering.'),

            # Kampot Sunlit Spice Plantation
            ('Certified PGI Kampot Black Peppercorns (100g Jar)', 'herbs-spices', 'kampot.pepper@farmerdirect.com', Decimal('6.50'), Product.Unit.PIECE, Decimal('1.00'), today - timedelta(days=20), True, True, 140, 'Intensely floral and pungent whole black peppercorns dried naturally under tropical sun.'),
            ('Rare Kampot Red Peppercorns (100g Jar)', 'herbs-spices', 'kampot.pepper@farmerdirect.com', Decimal('8.50'), Product.Unit.PIECE, Decimal('1.00'), today - timedelta(days=22), True, True, 95, 'Hand-picked berry by berry at fully ripe red stage. Complex sweet fruity notes.'),
            ('Kampot Gourmet White Peppercorns (100g Jar)', 'herbs-spices', 'kampot.pepper@farmerdirect.com', Decimal('9.00'), Product.Unit.PIECE, Decimal('1.00'), today - timedelta(days=25), True, False, 85, 'De-hulled ripe peppercorns with clean, elegant and long-lasting heat.'),
            ('Fresh Green Kampot Peppercorns (On Stem)', 'herbs-spices', 'kampot.pepper@farmerdirect.com', Decimal('3.50'), Product.Unit.BUNCH, Decimal('2.00'), today, True, True, 60, 'Fresh clusters picked daily for fried squid with green pepper and traditional broths.'),
            ('Organic Lemongrass Stalks', 'herbs-spices', 'kampot.pepper@farmerdirect.com', Decimal('1.20'), Product.Unit.BUNCH, Decimal('2.00'), today, True, False, 180, 'Thick fragrant oil-rich organic lemongrass stalks harvested with green roots.'),

            # Kandal River Hydro & Clean Greens
            ('Hydroponic Butterhead Crisp Lettuce', 'fresh-vegetables', 'kandal.greens@farmerdirect.com', Decimal('2.80'), Product.Unit.KG, Decimal('1.00'), today, True, True, 100, 'Tender, sweet leafy heads grown in climate-controlled mountain-pure water.'),
            ('Organic Green Bok Choy', 'fresh-vegetables', 'kandal.greens@farmerdirect.com', Decimal('1.50'), Product.Unit.KG, Decimal('2.00'), today, True, False, 160, 'Succulent white stalks and emerald leaves, washed and ready to cook.'),
            ('Curly Green Kale', 'fresh-vegetables', 'kandal.greens@farmerdirect.com', Decimal('4.50'), Product.Unit.KG, Decimal('0.50'), today, True, False, 75, 'Nutrient-dense superfood curly kale grown without chemical fungicides.'),
            ('Fresh Sweet Basil (Sweet & Holy Basil Mix)', 'herbs-spices', 'kandal.greens@farmerdirect.com', Decimal('1.20'), Product.Unit.BUNCH, Decimal('1.00'), today, True, False, 130, 'Hand-tied fragrant bunch of purple holy basil and broad sweet Italian basil.'),
            ('Fiery Birdseye Red Chilies', 'herbs-spices', 'kandal.greens@farmerdirect.com', Decimal('3.00'), Product.Unit.KG, Decimal('0.50'), today, True, False, 80, 'Freshly plucked bright red spicy chilies with intense Scoville heat.'),

            # Cardamom Coastal Fruit Orchard (Koh Kong)
            ('Ruby Red Dragon Fruit (Pitaya)', 'tropical-fruits', 'kohkong.orchard@farmerdirect.com', Decimal('2.60'), Product.Unit.KG, Decimal('2.00'), today, True, True, 220, 'Deep magenta flesh bursting with sweet natural juice and crunchy seeds.'),
            ('Keo Romeat Sweet Yellow Mangoes', 'tropical-fruits', 'kohkong.orchard@farmerdirect.com', Decimal('2.20'), Product.Unit.KG, Decimal('3.00'), today - timedelta(days=1), True, True, 300, 'Silky, fiberless golden sweet mangoes harvested at optimum brix sweetness.'),
            ('Fresh Whole Green Coconuts (Pack of 4)', 'tropical-fruits', 'kohkong.orchard@farmerdirect.com', Decimal('4.00'), Product.Unit.BOX, Decimal('1.00'), today, True, False, 150, 'Young sweet water coconuts with soft tender jelly meat inside.'),
            ('Cardamom Mountain Ripe Papaya', 'tropical-fruits', 'kohkong.orchard@farmerdirect.com', Decimal('1.50'), Product.Unit.KG, Decimal('2.00'), today, True, False, 180, 'Sweet red-orange solo papaya loaded with natural digestive enzymes.'),
            ('Sweet Striped Watermelon', 'tropical-fruits', 'kohkong.orchard@farmerdirect.com', Decimal('1.10'), Product.Unit.KG, Decimal('4.00'), today - timedelta(days=2), True, False, 400, 'Crisp refreshing red watermelon with exceptional natural sugar content.'),

            # Pursat Golden Citrus Groves
            ('Famous Pursat Sweet Green Oranges', 'tropical-fruits', 'pursat.citrus@farmerdirect.com', Decimal('2.50'), Product.Unit.KG, Decimal('3.00'), today, False, True, 350, 'The iconic Cambodian citrus: green skin, deep orange flesh, juicy sweet taste.'),
            ('Fresh Juicy Yellow Limes', 'tropical-fruits', 'pursat.citrus@farmerdirect.com', Decimal('1.90'), Product.Unit.KG, Decimal('1.00'), today, False, False, 200, 'Thin-skinned aromatic limes loaded with tart refreshing juice.'),
            ('Pursat River Giant Pomelo', 'tropical-fruits', 'pursat.citrus@farmerdirect.com', Decimal('3.20'), Product.Unit.PIECE, Decimal('1.00'), today - timedelta(days=3), False, False, 120, 'Sweet pink-flesh pomelo with easy peel segments and zero bitterness.'),
            ('Fresh Pressed Orange Juice (1 Liter Bottle)', 'artisanal-processed', 'pursat.citrus@farmerdirect.com', Decimal('3.50'), Product.Unit.LITER, Decimal('1.00'), today, False, False, 50, '100% pure cold-pressed unpasteurized Pursat orange juice with no added sugar.'),

            # Mondulkiri Highland Agro-Farms
            ('Mondulkiri Wild Forest Raw Honey (500ml)', 'dairy-eggs', 'mondulkiri.coffee@farmerdirect.com', Decimal('12.00'), Product.Unit.PIECE, Decimal('1.00'), today - timedelta(days=14), True, True, 80, '100% wild harvested unfiltered raw rainforest honey with floral wildflower notes.'),
            ('Highland Shade-Grown Arabica Beans (250g)', 'artisanal-processed', 'mondulkiri.coffee@farmerdirect.com', Decimal('7.00'), Product.Unit.BOX, Decimal('1.00'), today - timedelta(days=18), True, True, 110, 'Medium dark roasted high-altitude Arabica coffee with cocoa and hazelnut undertones.'),
            ('Highland Purple Passion Fruit', 'tropical-fruits', 'mondulkiri.coffee@farmerdirect.com', Decimal('3.00'), Product.Unit.KG, Decimal('1.00'), today, True, False, 90, 'Deep purple mountain passion fruits overflowing with aromatic tangy pulp.'),
            ('Organic Mountain Fresh Ginger', 'herbs-spices', 'mondulkiri.coffee@farmerdirect.com', Decimal('2.10'), Product.Unit.KG, Decimal('1.00'), today - timedelta(days=2), True, False, 170, 'Firm, pungent highland yellow ginger root with zero chemical residue.'),
            ('Sun-Dried Arabica Coffee Cherries (Cascara Tea)', 'artisanal-processed', 'mondulkiri.coffee@farmerdirect.com', Decimal('5.50'), Product.Unit.BOX, Decimal('1.00'), today - timedelta(days=20), True, False, 65, 'Fruity antioxidant infusion tea made from dried specialty coffee cherry pulp.'),

            # Takeo Free-Range Valley
            ('Pasture-Raised Free-Range Duck Eggs (Tray of 30)', 'dairy-eggs', 'takeo.aquafarm@farmerdirect.com', Decimal('6.00'), Product.Unit.BOX, Decimal('1.00'), today, True, True, 90, 'Large natural duck eggs with creamy golden yolks from wetland roaming flocks.'),
            ('Farm Fresh Brown Chicken Eggs (Tray of 30)', 'dairy-eggs', 'takeo.aquafarm@farmerdirect.com', Decimal('5.20'), Product.Unit.BOX, Decimal('1.00'), today, True, False, 120, 'Daily collected pasture-raised brown hen eggs with firm whites.'),
            ('Takeo Fresh Lotus Root', 'fresh-vegetables', 'takeo.aquafarm@farmerdirect.com', Decimal('2.50'), Product.Unit.KG, Decimal('1.00'), today, True, False, 140, 'Crisp lotus root segments harvested from fresh clean natural lake beds.'),
            ('Dried Organic Lotus Seeds (200g Bag)', 'artisanal-processed', 'takeo.aquafarm@farmerdirect.com', Decimal('4.80'), Product.Unit.PIECE, Decimal('1.00'), today - timedelta(days=10), True, False, 95, 'De-cored tender lotus seeds for healthy cooking, dessert soups, and teas.'),

            # Mekong Island Banana & Cacao
            ('Organic Namwa Banana Bunch (Cluster of 18)', 'tropical-fruits', 'kampongcham.banana@farmerdirect.com', Decimal('1.50'), Product.Unit.BUNCH, Decimal('2.00'), today, True, True, 200, 'Naturally sweetened Mekong riverbank ladyfinger bananas with velvet texture.'),
            ('Raw Mekong Fermented Cacao Nibs (200g)', 'artisanal-processed', 'kampongcham.banana@farmerdirect.com', Decimal('6.50'), Product.Unit.BOX, Decimal('1.00'), today - timedelta(days=30), True, True, 85, 'Single-origin solar-dried raw cacao nibs bursting with magnesium and rich chocolate notes.'),
            ('Virgin Cold-Pressed Coconut Oil (350ml)', 'artisanal-processed', 'kampongcham.banana@farmerdirect.com', Decimal('7.50'), Product.Unit.PIECE, Decimal('1.00'), today - timedelta(days=15), True, False, 100, 'Extra virgin unrefined coconut oil extracted from fresh tree-ripened island coconuts.'),
            ('Sun-Dried Sweet Banana Crisps (150g)', 'artisanal-processed', 'kampongcham.banana@farmerdirect.com', Decimal('2.20'), Product.Unit.BOX, Decimal('2.00'), today - timedelta(days=7), True, False, 160, '100% pure sun-dried bananas without added oils, preservatives, or artificial flavorings.'),

            # Kratie Dolphin Coast Pomelo Farm
            ('Koh Trong Island Heritage Sweet Pomelo', 'tropical-fruits', 'kratie.pomelo@farmerdirect.com', Decimal('3.80'), Product.Unit.PIECE, Decimal('1.00'), today - timedelta(days=2), True, True, 130, 'Prized seedless Mekong island pomelos renowned for juicy honey-sweet vesicles.'),
            ('Organic Fresh Galangal (Kah)', 'herbs-spices', 'kratie.pomelo@farmerdirect.com', Decimal('2.00'), Product.Unit.KG, Decimal('1.00'), today, True, False, 110, 'Aromatic culinary galangal root dug fresh for authentic Cambodian kroeung spice paste.'),
            ('Fresh Turmeric Roots (Curcumin Rich)', 'herbs-spices', 'kratie.pomelo@farmerdirect.com', Decimal('2.40'), Product.Unit.KG, Decimal('1.00'), today - timedelta(days=1), True, False, 140, 'Vibrant orange deep-soil turmeric roots packed with natural anti-inflammatory curcumin.'),
            ('Organic Raw Sugar Palm Blocks (500g)', 'artisanal-processed', 'kratie.pomelo@farmerdirect.com', Decimal('3.50'), Product.Unit.PIECE, Decimal('1.00'), today - timedelta(days=20), True, False, 120, 'Traditional wood-fired natural palm sugar with rich butterscotch caramel flavor.'),
        ]

        created_products = []
        for pdata in products_catalog:
            p_name, cat_slug, farmer_email, price, unit, min_qty, harvest, organic, featured, stock, desc = pdata
            farmer_profile = next(fp for fp in farmer_profiles if fp.user.email == farmer_email)
            category = categories[cat_slug]

            product, _ = Product.objects.update_or_create(
                farmer=farmer_profile,
                name=p_name,
                defaults={
                    'category': category,
                    'price': price,
                    'unit': unit,
                    'minimum_order_qty': min_qty,
                    'harvest_date': harvest,
                    'is_organic': organic,
                    'is_featured': featured,
                    'status': Product.Status.ACTIVE,
                    'short_description': desc[:180],
                    'description': desc,
                }
            )

            Inventory.objects.update_or_create(
                product=product,
                defaults={'available_quantity': stock, 'low_stock_threshold': 10.00}
            )
            created_products.append(product)

        self.stdout.write(self.style.SUCCESS(f"[OK] Created {len(created_products)} high-quality fresh produce products with live inventory."))

        # 6. Create Historical Orders, Payments, Deliveries, and Verified Reviews
        review_comments = [
            (5, "Incredible Freshness!", "The tomatoes arrived still smelling like the vine and perfectly firm. Our restaurant guests noticed the quality immediately!"),
            (5, "Exceptional Quality Rice", "The aroma when cooking this Phka Rumduol rice filled the entire kitchen. Will only buy directly from Battambang Heritage now."),
            (5, "Best Peppercorns Ever", "You can never go back to supermarket black pepper after tasting Kampot pepper direct from the plantation."),
            (4, "Sweet and juicy dragon fruit", "Very clean produce, prompt delivery, and properly packed in crates. Looking forward to our next weekly order."),
            (5, "Cleanest salad greens in town", "Hydroponic butterhead lettuce stayed crisp in our fridge for over 10 days! Remarkable freshness."),
            (5, "Genuine Wild Honey", "Rich, complex, and unpasteurized raw honey. Exactly what we wanted for our organic cafe."),
            (4, "Delicious Pursat Oranges", "Super juicy sweet oranges with thin peel. Perfect for morning fresh juices."),
            (5, "Outstanding farm-to-table service", "Fast direct delivery, reasonable prices, and direct communication with the farmer."),
        ]

        for i, customer in enumerate(customer_users):
            # Select 2-3 random products from different farmers
            selected_products = random.sample(created_products, k=3)
            for product in selected_products:
                qty = Decimal(str(random.choice([2, 3, 5])))
                subtotal = round(product.price * qty, 2)
                delivery_fee = Decimal('2.00')
                total = round(subtotal + delivery_fee, 2)

                order = Order.objects.create(
                    customer=customer,
                    farmer=product.farmer,
                    status=Order.Status.DELIVERED,
                    subtotal=subtotal,
                    delivery_fee=delivery_fee,
                    marketplace_commission=round(subtotal * Decimal('0.05'), 2),
                    total=total,
                    payment_status=Order.PaymentStatus.PAID,
                    payment_method=Order.PaymentMethod.COD,
                    delivery_address_snapshot={
                        'recipient_name': customer.username,
                        'street_address': 'Street 240, House #18B',
                        'province': product.farmer.province,
                    },
                    customer_notes='Please place by the kitchen entrance.'
                )

                order_item = OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name_snapshot=product.name,
                    product_image_snapshot='',
                    unit_snapshot=product.unit,
                    unit_price_snapshot=product.price,
                    quantity=qty,
                    subtotal=subtotal
                )

                Delivery.objects.create(
                    order=order,
                    delivery_type=Delivery.DeliveryType.FARMER_DIRECT,
                    driver_name="Sok Vanna",
                    driver_phone="+855 12 345 678",
                    actual_delivery=timezone.now() - timedelta(days=random.randint(1, 14))
                )

                Payment.objects.create(
                    order=order,
                    payment_method=Order.PaymentMethod.COD,
                    status=Payment.Status.COMPLETED,
                    amount=total,
                    paid_at=timezone.now() - timedelta(days=1)
                )

                # Attach Verified Review
                rating, title, comment = random.choice(review_comments)
                Review.objects.create(
                    product=product,
                    farmer=product.farmer,
                    customer=customer,
                    order_item=order_item,
                    rating=rating,
                    title=title,
                    comment=comment,
                    is_approved=True
                )

        # Recalculate all ratings
        for farmer in farmer_profiles:
            farmer.recalculate_rating()
        for product in created_products:
            product.recalculate_rating()

        self.stdout.write(self.style.SUCCESS("[OK] Created realistic delivered orders, payment settlements, and verified customer reviews."))
        self.stdout.write(self.style.SUCCESS("\n[SUCCESS] MARKETPLACE DATABASE SEEDED SUCCESSFULLY!"))
