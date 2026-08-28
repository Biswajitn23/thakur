import React, { useState } from "react";
import { Star, Heart, ShoppingBag, Check, Zap } from "lucide-react";
import type { ProductItem } from "@/hooks/use-products";

interface ProductCardProps {
  product: ProductItem;
  onAddToCart: (
    product: { name: string; price: string; img: string },
    qty: number,
    event?: React.MouseEvent<HTMLElement>
  ) => void;
  currencySymbol?: string;
  currencyRate?: number;
  showLightningBadge?: boolean;
}

export function ProductCard({
  product,
  onAddToCart,
  currencySymbol = "₹",
  currencyRate = 1,
  showLightningBadge = false,
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // Parse price string e.g. "₹799" -> 799
  const parseNum = (str?: string) => {
    if (!str) return 0;
    const val = parseInt(str.replace(/[^0-9]/g, ""), 10);
    return isNaN(val) ? 0 : val;
  };

  const rawPrice = parseNum(product.price);
  const rawOldPrice = parseNum(product.old);

  const displayPrice = Math.round(rawPrice * currencyRate);
  const displayOldPrice = Math.round(rawOldPrice * currencyRate);

  const discountPercent =
    rawOldPrice > rawPrice
      ? Math.round(((rawOldPrice - rawPrice) / rawOldPrice) * 100)
      : 0;

  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(
      {
        name: product.name,
        price: `${currencySymbol}${displayPrice}`,
        img: product.img,
      },
      quantity,
      e
    );
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div className="group relative flex flex-col justify-between h-full bg-white rounded-2xl border border-gold/20 shadow-sm hover:shadow-luxe hover:border-gold/50 transition-all duration-300 overflow-hidden">
      {/* Top Badges & Wishlist */}
      <div className="relative w-full aspect-square bg-gradient-to-b from-ivory to-cream/60 overflow-hidden flex items-center justify-center p-4">
        {/* Badges Stack */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
          {showLightningBadge && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider shadow-md animate-pulse">
              <Zap className="w-3 h-3 fill-slate-950" /> Lightning Deal
            </span>
          )}
          {product.tag && (
            <span className="px-2.5 py-0.5 rounded-full bg-forest text-ivory text-[10px] font-bold uppercase tracking-wider shadow-sm">
              {product.tag}
            </span>
          )}
          {discountPercent > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-extrabold tracking-wider shadow-sm">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsWishlisted(!isWishlisted);
          }}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center border border-gold/20 text-forest/70 hover:text-rose-600 hover:bg-white transition-colors shadow-sm cursor-pointer"
          aria-label="Add to Wishlist"
        >
          <Heart
            className={`w-4 h-4 transition-transform ${isWishlisted ? "fill-rose-500 text-rose-500 scale-110" : ""
              }`}
          />
        </button>

        {/* Product Image */}
        <img
          src={product.img}
          alt={product.name}
          loading="lazy"
          className="max-h-full max-w-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-500 ease-out"
        />
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Rating */}
          <div className="flex items-center gap-1.5 text-xs text-forest/70 mb-1">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="ml-1 font-bold text-forest text-xs">
                {product.rating.toFixed(1)}
              </span>
            </div>
            <span className="text-forest/40">•</span>
            <span className="text-[11px] text-forest/65">
              ({product.reviews.toLocaleString()} reviews)
            </span>
          </div>

          {/* Title */}
          <h3 className="font-display font-bold text-forest text-base sm:text-lg leading-tight line-clamp-1 group-hover:text-gold transition-colors">
            {product.name}
          </h3>

          {/* Subtitle / Short Description */}
          <p className="text-xs text-forest/70 line-clamp-2 mt-1 min-h-[32px] leading-relaxed">
            {product.subtitle}
          </p>

          {/* Benefit tags summary */}
          {product.benefits && product.benefits.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              <span className="inline-block px-2 py-0.5 rounded bg-forest/5 text-forest/80 text-[10px] font-medium border border-forest/10 truncate max-w-full">
                🌿 {product.benefits[0]}
              </span>
            </div>
          )}
        </div>

        {/* Pricing & Add to Cart Action */}
        <div className="pt-3 border-t border-gold/15 flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="font-display font-extrabold text-forest text-lg sm:text-xl">
                {currencySymbol}
                {displayPrice.toLocaleString()}
              </span>
              {displayOldPrice > displayPrice && (
                <span className="text-xs text-forest/40 line-through font-normal">
                  {currencySymbol}
                  {displayOldPrice.toLocaleString()}
                </span>
              )}
            </div>
            {discountPercent > 0 && (
              <span className="text-[11px] font-bold text-emerald-700">
                Save {currencySymbol}
                {(displayOldPrice - displayPrice).toLocaleString()}
              </span>
            )}
          </div>

          {/* Quantity Selector & Add Button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-gold/30 rounded-xl overflow-hidden bg-ivory/60 shrink-0 h-9">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-7 h-full flex items-center justify-center font-bold text-xs text-forest/70 hover:bg-gold/10 transition cursor-pointer"
              >
                −
              </button>
              <span className="w-7 text-center font-mono font-bold text-xs text-forest select-none">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-7 h-full flex items-center justify-center font-bold text-xs text-forest/70 hover:bg-gold/10 transition cursor-pointer"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={isAdded}
              className={`flex-1 h-9 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer ${isAdded
                  ? "bg-emerald-700 text-white"
                  : "bg-forest hover:bg-forest-deep text-ivory active:scale-95"
                }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Added!
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5 text-gold" /> Add to Cart
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
