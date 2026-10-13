import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';

interface BroadcastClockProps {
  className?: string;
  compactOnMobile?: boolean;
}

export const BroadcastClock: React.FC<BroadcastClockProps> = ({ 
  className = '',
  compactOnMobile = true 
}) => {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    // Update every second in sync with system clock
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const days = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
  const months = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEP', 'OCT', 'NOV', 'DÉC'];

  const dayName = days[now.getDay()];
  const dayNum = String(now.getDate()).padStart(2, '0');
  const monthName = months[now.getMonth()];
  const year = now.getFullYear();

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const fullDate = `${dayName} ${dayNum} ${monthName} ${year}`;
  const shortDate = `${dayNum} ${monthName}`;
  const timeDisplay = `${hours}:${minutes}:${seconds}`;

  return (
    <div 
      className={`font-mono tabular-nums select-none flex items-center gap-2 bg-[#060a14]/90 hover:bg-[#0c1224] border border-white/10 rounded-xl px-2.5 sm:px-3 py-1.5 shadow-inner text-zinc-100 transition-colors ${className}`}
      title="Horloge temps réel régie TV PRO MEDIA"
      id="live-broadcast-clock"
    >
      {/* Real-time broadcast pulse */}
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>

      {/* Date display (monochromatic font) */}
      <div className="flex items-center gap-1.5 text-zinc-400">
        <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        <span className={compactOnMobile ? "hidden sm:inline font-bold tracking-wider text-zinc-300 text-[11px] md:text-xs uppercase" : "font-bold tracking-wider text-zinc-300 text-[11px] md:text-xs uppercase"}>
          {fullDate}
        </span>
        {compactOnMobile && (
          <span className="sm:hidden font-bold tracking-wider text-zinc-300 text-[11px] uppercase">
            {shortDate}
          </span>
        )}
      </div>

      {/* Monochromatic separator */}
      <span className="text-zinc-600 font-bold" aria-hidden="true">|</span>

      {/* Time display (HH:MM:SS monochromatic font) */}
      <div className="flex items-center gap-1.5 text-zinc-100 font-black tracking-widest text-xs md:text-sm">
        <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        <span className="text-white drop-shadow-sm">
          {timeDisplay}
        </span>
      </div>
    </div>
  );
};

export default BroadcastClock;
