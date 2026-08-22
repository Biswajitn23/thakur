import { useState, useEffect } from "react";
import { Zap, Clock, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/ui/ProductCard";
import type { ProductItem } from "@/hooks/use-products";

interface LightningSaleSectionProps {
  products: ProductItem[];
  onAddToCart: (
    product: { name: string; price: string; img: string },
    qty: number,
    event?: React.MouseEvent<HTMLElement>
  ) => void;
  currencySymbol?: string;
  currencyRate?: number;
}

export function LightningSaleSection({
  products,
  onAddToCart,
  currencySymbol = "₹",
  currencyRate = 1,
}: LightningSaleSectionProps) {
  // Target 12 hours into the future for sale countdown
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({
    days: 0,
    hours: 11,
    minutes: 48,
    seconds: 32,
    isExpired: false,
  });

  useEffect(() => {
    // Initial target end time: 12 hours from now stored in localStorage to persist across reloads
    const STORAGE_KEY = "thakur_lightning_sale_endtime";
    let targetTime: number;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      targetTime = parseInt(saved, 10);
      // If already expired, reset target time to 24 hours from now
      if (Date.now() >= targetTime) {
        targetTime = Date.now() + 24 * 60 * 60 * 1000;
        localStorage.setItem(STORAGE_KEY, targetTime.toString());
      }
    } else {
      targetTime = Date.now() + 12 * 60 * 60 * 1000 + 48 * 60 * 1000 + 32 * 1000;
      localStorage.setItem(STORAGE_KEY, targetTime.toString());
    }

    const timer = setInterval(() => {
      const now = Date.now();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
        });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setTimeLeft({
          days,
          hours,
          minutes,
          seconds,
          isExpired: false,
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Filter products for Lightning Sale (top discounted or tagged items)
  const saleProducts = products.slice(0, 4);

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
      {/* Container with visual border & banner styling */}
      <div className="rounded-3xl border border-amber-400/40 bg-gradient-to-br from-amber-500/10 via-ivory to-cream p-6 sm:p-8 shadow-luxe relative overflow-hidden">
        {/* Glowing background accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header with Live Timer */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10 border-b border-gold/20 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md animate-bounce shrink-0">
              <Zap className="w-6 h-6 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-900 text-[10px] font-extrabold uppercase tracking-widest">
                  Limited Time Only
                </span>
                <span className="text-xs text-forest/60 font-semibold hidden sm:inline">
                  • Extra 25% Off Auto-Applied
                </span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-forest mt-1">
                ⚡ Lightning Flash Sale
              </h2>
            </div>
          </div>

          {/* Countdown Clock Display */}
          <div className="flex items-center gap-2 bg-forest text-ivory px-4 py-2.5 rounded-2xl shadow-md shrink-0 border border-gold/30">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-amber-300 uppercase tracking-widest mr-1">
              Ends In:
            </span>
            {timeLeft.isExpired ? (
              <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                Sale Expired
              </span>
            ) : (
              <div className="flex items-center gap-1 font-mono text-sm font-black text-ivory">
                <div className="flex flex-col items-center bg-forest-deep px-2 py-0.5 rounded-md min-w-[28px]">
                  <span>{String(timeLeft.days).padStart(2, "0")}</span>
                  <span className="text-[8px] font-sans font-normal text-amber-300/80 -mt-1">
                    DAYS
                  </span>
                </div>
                <span>:</span>
                <div className="flex flex-col items-center bg-forest-deep px-2 py-0.5 rounded-md min-w-[28px]">
                  <span>{String(timeLeft.hours).padStart(2, "0")}</span>
                  <span className="text-[8px] font-sans font-normal text-amber-300/80 -mt-1">
                    HRS
                  </span>
                </div>
                <span>:</span>
                <div className="flex flex-col items-center bg-forest-deep px-2 py-0.5 rounded-md min-w-[28px]">
                  <span>{String(timeLeft.minutes).padStart(2, "0")}</span>
                  <span className="text-[8px] font-sans font-normal text-amber-300/80 -mt-1">
                    MIN
                  </span>
                </div>
                <span>:</span>
                <div className="flex flex-col items-center bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md min-w-[28px]">
                  <span>{String(timeLeft.seconds).padStart(2, "0")}</span>
                  <span className="text-[8px] font-sans font-extrabold text-slate-950 -mt-1">
                    SEC
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Carousel / Grid Container */}
        <div className="relative z-10">
          {/* Mobile: Horizontal Swipe Carousel | Desktop: Responsive 4-col Grid */}
          <div
            className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 overflow-x-auto sm:overflow-visible pb-4 sm:pb-0 scrollbar-none snap-x snap-mandatory -mx-2 px-2"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {saleProducts.map((product) => (
              <div
                key={`sale-${product.id}`}
                className="w-[260px] sm:w-auto shrink-0 snap-start h-full"
              >
                <ProductCard
                  product={product}
                  onAddToCart={onAddToCart}
                  currencySymbol={currencySymbol}
                  currencyRate={currencyRate}
                  showLightningBadge={true}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
