import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ShoppingBag, Truck, ShieldCheck, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
      {/* Title */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-forest-700 bg-forest-50 border border-forest-200 px-3 py-1 rounded-full">
          Direct Agricultural Commerce
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-display">
          How FarmerDirect Works
        </h1>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
          We eliminated the 5 layers of brokers, wholesale middlemen, and warehouse storage to create a clean pipeline from farm field to your kitchen.
        </p>
      </div>

      {/* For Customers */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-stone-200 shadow-soft space-y-8">
        <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-forest-100 text-forest-800 flex items-center justify-center font-bold">
            🛒
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900">For Conscious Consumers & Restaurants</h2>
            <p className="text-xs text-stone-500">How to order fresh harvest with full transparency</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="space-y-2 p-4 rounded-2xl bg-stone-50 border border-stone-100">
            <span className="font-bold text-forest-700 text-sm">Step 1</span>
            <h3 className="font-bold text-stone-900 text-sm">Discover Local Harvest</h3>
            <p className="text-stone-600 leading-relaxed">
              Explore daily produce listings filtered by category, province, and certified organic practices.
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-2xl bg-stone-50 border border-stone-100">
            <span className="font-bold text-forest-700 text-sm">Step 2</span>
            <h3 className="font-bold text-stone-900 text-sm">Direct Checkout</h3>
            <p className="text-stone-600 leading-relaxed">
              Choose Cash on Delivery, KHQR Bakong, or Card. Orders are automatically dispatched to the specific farms.
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-2xl bg-stone-50 border border-stone-100">
            <span className="font-bold text-forest-700 text-sm">Step 3</span>
            <h3 className="font-bold text-stone-900 text-sm">Fresh Delivery & Review</h3>
            <p className="text-stone-600 leading-relaxed">
              Receive your produce within 24 hours of harvest and leave a verified review to support your grower.
            </p>
          </div>
        </div>
      </div>

      {/* For Farmers */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-stone-200 shadow-soft space-y-8">
        <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            🚜
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900">For Farmers & Producers</h2>
            <p className="text-xs text-stone-500">Sell at your own fair prices and expand your market</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="space-y-2 p-4 rounded-2xl bg-stone-50 border border-stone-100">
            <span className="font-bold text-amber-700 text-sm">Step 1</span>
            <h3 className="font-bold text-stone-900 text-sm">Create Farm Profile</h3>
            <p className="text-stone-600 leading-relaxed">
              Register your farm, add your farming background story, photos, and submit verification documents.
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-2xl bg-stone-50 border border-stone-100">
            <span className="font-bold text-amber-700 text-sm">Step 2</span>
            <h3 className="font-bold text-stone-900 text-sm">List Your Harvest</h3>
            <p className="text-stone-600 leading-relaxed">
              Set your own prices, units, minimum order requirements, and available inventory with zero upfront fees.
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-2xl bg-stone-50 border border-stone-100">
            <span className="font-bold text-amber-700 text-sm">Step 3</span>
            <h3 className="font-bold text-stone-900 text-sm">Fulfill & Grow</h3>
            <p className="text-stone-600 leading-relaxed">
              Receive real-time alerts when orders arrive, harvest on schedule, and build direct loyal relationships with buyers.
            </p>
          </div>
        </div>

        <div className="pt-4 text-center">
          <Link to="/register">
            <Button variant="amber" size="md">
              Apply as a Verified Farmer
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

