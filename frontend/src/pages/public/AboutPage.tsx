import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ShieldCheck, Heart, Award, Users } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
      {/* Header / Purpose */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-forest-700 bg-forest-50 border border-forest-200 px-3 py-1 rounded-full">
          Our Purpose
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-display">
          Rebuilding Agricultural Trade on Trust & Fairness
        </h1>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
          FarmerDirect was founded to restore the direct human connection between the families and businesses who consume food and the hard-working farmers who cultivate it.
        </p>
      </div>

      {/* The Problem & Model */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-stone-200 shadow-soft space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4 text-xs sm:text-sm text-stone-700 leading-relaxed">
            <h2 className="text-xl font-bold text-stone-900">The Problem We Solve</h2>
            <p>
              In traditional grocery networks, agricultural goods pass through middlemen, aggregators, brokers, and logistics warehouses. By the time produce reaches consumer tables, days or weeks have elapsed, nutrient levels have depleted, and up to 70% of the retail price has been absorbed by non-producers.
            </p>
            <p>
              Meanwhile, smallholder farmers are often forced to take cut-rate prices that barely cover their seasonal seed and labor costs.
            </p>
          </div>
          <div className="bg-forest-50 rounded-2xl p-6 border border-forest-100 space-y-3">
            <h3 className="font-bold text-forest-900 text-sm">The FarmerDirect Model</h3>
            <ul className="space-y-2 text-xs text-forest-800">
              <li className="flex items-start gap-2">
                <span className="font-bold">✓</span>
                <span>Farmers set their own fair prices and receive over 95% of revenues.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">✓</span>
                <span>Buyers enjoy produce harvested just hours before delivery.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">✓</span>
                <span>Complete transparency with verified farm provenance on every item.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Founder & Leadership Section */}
      <div className="bg-gradient-to-br from-white via-forest-50/30 to-stone-50 rounded-3xl p-8 sm:p-12 border border-stone-200 shadow-soft relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-forest-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Portrait Column */}
          <div className="lg:col-span-5 flex flex-col items-center text-center space-y-4">
            <div className="relative group">
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-forest-600 to-amber-500 rounded-3xl blur-sm opacity-60 group-hover:opacity-100 transition duration-500" />
              <img
                src="/images/krai-theara.jpg"
                alt="Krai Theara — Creator and Founder of Farmer Direct Sale"
                className="relative w-64 h-80 sm:w-72 sm:h-96 object-cover object-top rounded-2xl shadow-xl border-2 border-white"
              />
              <div className="absolute bottom-3 left-3 right-3 bg-stone-900/85 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 text-white shadow-lg">
                <p className="font-bold text-sm tracking-wide">Krai Theara</p>
                <p className="text-[11px] text-forest-300 font-medium">Founder & Creator • Farmer Direct Sale</p>
              </div>
            </div>
          </div>

          {/* Vision & Narrative Column */}
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-forest-700 bg-forest-100/80 border border-forest-200 px-3 py-1 rounded-full inline-block">
                Founder's Message & Vision
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-display leading-tight">
                Empowering Agriculture Through Thoughtful Digital Innovation
              </h2>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-stone-700 leading-relaxed">
              <p className="text-base text-stone-900 font-semibold leading-snug">
                “Hello, my name is Krai Theara.”
              </p>
              <p>
                I am deeply passionate about technology, purposeful innovation, and engineering digital solutions that drive meaningful, positive social change. As the creator of <strong>Farmer Direct Sale</strong>, my goal is to leverage modern digital capabilities to bridge the gap between hard-working farmers and consumers, fostering fair economic opportunities and thriving local communities.
              </p>
              <p>
                By connecting producers directly with households and commercial buyers, we remove parasitic intermediary markups, ensure crops are traded at genuine fair-market value, and restore equity to those who feed our nation.
              </p>

              {/* Vision Highlight Box */}
              <div className="bg-white/90 backdrop-blur-sm border-l-4 border-forest-600 rounded-r-2xl p-5 shadow-xs space-y-2 mt-4">
                <p className="text-[11px] uppercase font-extrabold tracking-wider text-forest-800">
                  Our Guiding Vision
                </p>
                <blockquote className="text-stone-800 text-sm sm:text-base italic font-medium leading-relaxed">
                  “My vision is to build a future where technology empowers farmers, connects communities, and creates a fair, transparent, and sustainable marketplace for everyone.”
                </blockquote>
                <p className="text-[11px] text-stone-500 font-semibold pt-1">
                  — Krai Theara, Founder & Creator of Farmer Direct Sale
                </p>
              </div>
            </div>

            {/* Core Values Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-white rounded-xl p-3 border border-stone-200/80 shadow-xs flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-forest-50 text-forest-700 shrink-0">
                  <Sprout className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900">Empowerment</p>
                  <p className="text-[10px] text-stone-500">Tech for local growers</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-3 border border-stone-200/80 shadow-xs flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-700 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900">Community</p>
                  <p className="text-[10px] text-stone-500">Direct trade bonds</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-3 border border-stone-200/80 shadow-xs flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900">Fairness</p>
                  <p className="text-[10px] text-stone-500">Sustainable markets</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Banner */}
      <div className="bg-forest-900 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display">
            Support Local Farmers with Every Order
          </h2>
          <p className="text-forest-100 text-xs sm:text-sm leading-relaxed">
            Experience organic Cambodian agriculture directly from the family farms that nurture it. Transparent pricing, zero broker markups, and verified provenance.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link to="/products">
              <Button variant="primary" className="bg-forest-600 hover:bg-forest-500 text-white border-none font-bold">
                Explore Fresh Produce
              </Button>
            </Link>
            <Link to="/farmers">
              <Button variant="outline" className="text-white border-white/30 hover:bg-white/10 font-bold">
                Meet Verified Farmers
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

