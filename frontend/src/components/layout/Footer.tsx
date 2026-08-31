import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ShieldCheck, Heart, MapPin, Mail, Phone, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Col 1: Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-forest-600 flex items-center justify-center text-white">
                <Sprout className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight font-display">
                Farmer<span className="text-forest-400">Direct</span>
              </span>
            </Link>
            <p className="text-sm text-stone-400 leading-relaxed max-w-sm">
              Empowering local farmers across Cambodia to sell fresh organic harvest directly to families, restaurants, and businesses with transparent pricing and fair trade.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-forest-300">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>Verified Farms</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>100% Fair to Growers</span>
              </div>
            </div>
          </div>

          {/* Col 2: Marketplace */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Produce</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/products?category=fresh-vegetables" className="hover:text-forest-400 transition-colors">
                  Fresh Vegetables
                </Link>
              </li>
              <li>
                <Link to="/products?category=tropical-fruits" className="hover:text-forest-400 transition-colors">
                  Tropical Fruits
                </Link>
              </li>
              <li>
                <Link to="/products?category=grains-rice" className="hover:text-forest-400 transition-colors">
                  Jasmine & Heritage Rice
                </Link>
              </li>
              <li>
                <Link to="/products?category=herbs-spices" className="hover:text-forest-400 transition-colors">
                  Kampot Pepper & Herbs
                </Link>
              </li>
              <li>
                <Link to="/products?is_organic=true" className="hover:text-forest-400 transition-colors">
                  100% Certified Organic
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Farmers & Business */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Growers & B2B</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/register" className="hover:text-forest-400 transition-colors">
                  Become a Verified Farmer
                </Link>
              </li>
              <li>
                <Link to="/farmers" className="hover:text-forest-400 transition-colors">
                  Farm Directory
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-forest-400 transition-colors">
                  Restaurant Wholesale Supply
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-forest-400 transition-colors">
                  Quality Standards
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Support */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Support</h4>
            <ul className="space-y-2.5 text-sm text-stone-400">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-forest-500 shrink-0" />
                <span>Siem Reap & Phnom Penh, KH</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-forest-500 shrink-0" />
                <span>support@farmerdirect.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-forest-500 shrink-0" />
                <span>+855 12 888 999</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-stone-800 text-xs text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 FarmerDirect Marketplace Inc. Built with love for sustainable agriculture.</p>
          <div className="flex items-center gap-6">
            <Link to="/about" className="hover:text-stone-300">About Us</Link>
            <Link to="/how-it-works" className="hover:text-stone-300">How It Works</Link>
            <a href="/swagger/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-forest-400">
              <span>OpenAPI Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

