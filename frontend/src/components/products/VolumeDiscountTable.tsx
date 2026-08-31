import React from 'react';
import { Tag, Sparkles, Building2 } from 'lucide-react';
import type { VolumeDiscountTier } from '../../types';

interface VolumeDiscountTableProps {
  basePrice: string;
  unit: string;
  tiers?: VolumeDiscountTier[];
  selectedQuantity?: number;
}

export const VolumeDiscountTable: React.FC<VolumeDiscountTableProps> = ({
  basePrice,
  unit,
  tiers = [],
  selectedQuantity = 1,
}) => {
  if (!tiers || tiers.length === 0) return null;

  return (
    <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200/80 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-forest-900">
          <Building2 className="w-4 h-4 text-forest-600" />
          <span>B2B Wholesale & Bulk Volume Tiers</span>
        </div>
        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Auto-applied at checkout
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        {/* Tier 0: Retail */}
        <div
          className={`p-2.5 rounded-xl border transition-all ${
            selectedQuantity < parseFloat(tiers[0]?.min_quantity || '999')
              ? 'bg-white border-forest-600 shadow-xs'
              : 'bg-white/60 border-stone-200'
          }`}
        >
          <div className="text-[11px] text-stone-500 font-medium">Retail (1 – {parseFloat(tiers[0]?.min_quantity || '10') - 1} {unit})</div>
          <div className="font-extrabold text-stone-900 text-sm mt-0.5">${parseFloat(basePrice).toFixed(2)} <span className="text-[10px] font-normal text-stone-400">/{unit}</span></div>
          <div className="text-[10px] text-stone-400 mt-1">Standard rate</div>
        </div>

        {/* Dynamic Tiers */}
        {tiers.map((tier, idx) => {
          const minQty = parseFloat(tier.min_quantity);
          const nextMin = tiers[idx + 1] ? parseFloat(tiers[idx + 1].min_quantity) - 1 : null;
          const isCurrent =
            selectedQuantity >= minQty && (nextMin === null || selectedQuantity <= nextMin);

          return (
            <div
              key={tier.id}
              className={`p-2.5 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-white border-forest-600 shadow-sm ring-2 ring-forest-100'
                  : 'bg-white/60 border-stone-200'
              }`}
            >
              <div className="text-[11px] text-forest-800 font-bold flex items-center justify-between">
                <span>{minQty}{nextMin ? ` – ${nextMin}` : '+'} {unit}</span>
                <span className="text-emerald-700 bg-emerald-100 text-[10px] px-1.5 py-0.2 rounded font-extrabold">
                  -{parseFloat(tier.discount_percentage)}%
                </span>
              </div>
              <div className="font-extrabold text-forest-900 text-sm mt-0.5">
                ${parseFloat(tier.unit_price).toFixed(2)} <span className="text-[10px] font-normal text-stone-400">/{unit}</span>
              </div>
              <div className="text-[10px] text-stone-400 mt-1 flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" />
                <span>Save ${(parseFloat(basePrice) - parseFloat(tier.unit_price)).toFixed(2)}/{unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

