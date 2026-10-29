import { Megaphone, ArrowUpRight, Sparkles } from 'lucide-react';

interface SponsorBannerProps {
  onOpenPartnerModal: () => void;
}

export default function SponsorBanner({ onOpenPartnerModal }: SponsorBannerProps) {
  return (
    <div className="w-full bg-gradient-to-r from-[#180a0a] via-[#1a1228] to-[#0c1527] border-y border-amber-500/20 py-2.5 px-4 shadow-inner" id="sponsor-weekly-banner">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        
        {/* Left Side: Badge & Catchphrase */}
        <div className="flex items-center gap-2.5 text-center sm:text-left flex-wrap justify-center sm:justify-start">
          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-red-600 text-black font-black px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider shadow-sm animate-pulse shrink-0">
            <Sparkles className="w-3 h-3 fill-current" />
            Espace Sponsorisé
          </span>
          
          <p className="text-gray-200 text-xs font-semibold leading-tight">
            <strong className="text-white">Vous avez une émission, un culte ou un commerce ?</strong>{' '}
            <span className="text-amber-400 font-bold">Diffusez chaque semaine dès 15 $USD</span> et touchez des milliers de spectateurs.
          </p>
        </div>

        {/* Right Side: CTA Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenPartnerModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black rounded-lg text-[11px] uppercase tracking-wider shadow-lg shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-95 focus:outline-none border border-amber-400/30"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Réserver mon créneau hebdo</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

      </div>
    </div>
  );
}
