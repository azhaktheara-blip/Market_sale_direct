import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ShieldCheck, Heart, Award, Users } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
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
    </div>
  );
};

