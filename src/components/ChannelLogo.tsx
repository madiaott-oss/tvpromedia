import React, { useState, useEffect } from 'react';
import { 
  Tv, Radio, Music, Flame, Award, Film, Globe, Compass, CloudSun, Heart, ShieldAlert
} from 'lucide-react';

interface ChannelLogoProps {
  channelName: string;
  logoUrl?: string;
  category: string;
  channelNum?: string;
  isCurrent?: boolean;
  className?: string;
}

export const ChannelLogo: React.FC<ChannelLogoProps> = ({
  channelName,
  logoUrl,
  category,
  channelNum,
  isCurrent = false,
  className = ''
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [logoUrl]);

  // Helper to extract clean initials from channel name (e.g., "France 2 HD" -> "F2", "ESPOIR TV HD" -> "ESP")
  const getInitials = (name: string): string => {
    if (!name) return 'TV';
    const cleanName = name.replace(/HD|TV|CANAL|PLUS|LIVE|STREAM|RADIO/gi, '').trim();
    const words = cleanName.split(/[\s_-]+/);
    if (words.length >= 2) {
      const first = words[0].charAt(0);
      const second = words[1].charAt(0);
      // If second is a digit or letter, use it
      if (/[a-zA-Z0-9]/.test(first) && /[a-zA-Z0-9]/.test(second)) {
        return (first + second).toUpperCase();
      }
    }
    const filtered = cleanName.replace(/[^a-zA-Z0-9]/g, '');
    if (filtered.length >= 3) {
      return filtered.slice(0, 3).toUpperCase();
    }
    return name.slice(0, 3).toUpperCase();
  };

  // Helper to define theme gradients based on Category
  const getCategoryStyles = (cat: string) => {
    const norm = (cat || '').toUpperCase();
    switch (norm) {
      case 'RELIGIEUX':
        return {
          gradient: 'from-indigo-950 via-purple-900 to-amber-600/35',
          border: 'border-purple-500/30',
          accent: 'bg-amber-400',
          textColor: 'text-amber-400',
          subLabel: 'VOIX & FOI',
          icon: Heart
        };
      case 'SPORTS':
        return {
          gradient: 'from-red-950 via-red-900 to-orange-600/40',
          border: 'border-red-500/30',
          accent: 'bg-red-500',
          textColor: 'text-red-400',
          subLabel: 'SPORTS EN DIRECT',
          icon: Award
        };
      case 'NEWS':
        return {
          gradient: 'from-slate-950 via-blue-950 to-red-600/30',
          border: 'border-blue-500/30',
          accent: 'bg-red-600',
          textColor: 'text-blue-400',
          subLabel: 'INFO CONTINU',
          icon: Flame
        };
      case 'FILMS':
        return {
          gradient: 'from-black via-zinc-900 to-red-950/40',
          border: 'border-zinc-700/40',
          accent: 'bg-rose-650',
          textColor: 'text-rose-400',
          subLabel: 'CINÉ & SÉRIES',
          icon: Film
        };
      case 'MUSIQUE':
        return {
          gradient: 'from-purple-950 via-pink-950 to-indigo-650/30',
          border: 'border-pink-500/30',
          accent: 'bg-pink-500',
          textColor: 'text-pink-400',
          subLabel: 'HIT MUSIQUE',
          icon: Music
        };
      case 'GENERALISTE':
        return {
          gradient: 'from-slate-900 via-neutral-900 to-slate-800/30',
          border: 'border-slate-500/20',
          accent: 'bg-emerald-500',
          textColor: 'text-emerald-400',
          subLabel: 'GÉNÉRALISTE',
          icon: Tv
        };
      case 'DOCUMENTAIRE':
        return {
          gradient: 'from-teal-950 via-emerald-950 to-amber-800/25',
          border: 'border-teal-500/30',
          accent: 'bg-teal-400',
          textColor: 'text-teal-400',
          subLabel: 'DÉCOUVERTE',
          icon: Compass
        };
      case 'ENFANTS':
        return {
          gradient: 'from-sky-950 via-blue-900 to-pink-500/20',
          border: 'border-sky-500/30',
          accent: 'bg-sky-400',
          textColor: 'text-sky-300',
          subLabel: 'JEUNESSE',
          icon: Globe
        };
      case 'RADIO':
        return {
          gradient: 'from-amber-950 via-[#181005] to-orange-900/30',
          border: 'border-amber-500/20',
          accent: 'bg-amber-500',
          textColor: 'text-amber-500',
          subLabel: 'LIVE FM',
          icon: Radio
        };
      case 'METEO':
        return {
          gradient: 'from-sky-900 via-slate-900 to-[#122c4d]/40',
          border: 'border-blue-400/25',
          accent: 'bg-cyan-400',
          textColor: 'text-cyan-400',
          subLabel: 'CLIMAT',
          icon: CloudSun
        };
      default:
        return {
          gradient: 'from-neutral-950 via-neutral-900 to-slate-900',
          border: 'border-neutral-500/20',
          accent: 'bg-red-600',
          textColor: 'text-gray-400',
          subLabel: 'TV DIRECT',
          icon: Tv
        };
    }
  };

  const style = getCategoryStyles(category);
  const IconComponent = style.icon;
  const initials = getInitials(channelName);

  // If a valid URL is provided and has not failed, show it in a premium container
  if (logoUrl && logoUrl.trim() !== '' && !hasError) {
    return (
      <div className={`relative w-full h-full flex items-center justify-center p-2 rounded-lg bg-black/40 border border-white/[0.04] group/logo overflow-hidden ${className}`}>
        {/* Subtle background glow of channel colors */}
        <div className={`absolute inset-0 bg-gradient-to-tr ${style.gradient} opacity-20 group-hover/logo:opacity-30 transition-opacity duration-300 pointer-events-none`}></div>
        <img
          src={logoUrl}
          alt={channelName}
          loading="lazy"
          className="w-full h-full object-contain filter group-hover/logo:scale-110 transition-all duration-500 select-none relative z-10"
          onError={() => setHasError(true)}
          referrerPolicy="no-referrer"
        />
        
        {/* Decorative thin bottom border accent with category color */}
        <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${style.accent} opacity-50`}></div>
      </div>
    );
  }

  // Fallback / Placeholder custom vector badge
  return (
    <div className={`relative w-full h-full rounded-lg bg-gradient-to-b ${style.gradient} ${style.border} border flex flex-col items-center justify-center p-3 text-center overflow-hidden group/vector shadow-inner ${className}`}>
      
      {/* Decorative vector background lines / grids */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none"></div>
      <div className="absolute -top-10 -left-10 w-24 h-24 bg-white/[0.02] rounded-full blur-xl pointer-events-none"></div>
      <div className={`absolute -bottom-8 -right-8 w-20 h-20 ${style.accent} opacity-5 rounded-full blur-lg pointer-events-none`}></div>
      
      {/* Glossy diagonal overlay reflection effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover/vector:translate-x-full duration-1000 transition-transform ease-out pointer-events-none"></div>

      {/* Main Logo initials */}
      <div className="relative flex flex-col items-center justify-center z-10 flex-1 select-none">
        <span className={`text-2xl md:text-3xl font-black tracking-tighter text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] group-hover/vector:scale-105 transition-transform duration-300 font-sans`}>
          {initials}
        </span>
        
        {/* Subtle sub-branding label */}
        <span className="text-[7.5px] uppercase font-black tracking-widest text-white/40 mt-1 flex items-center gap-1">
          <IconComponent className="w-2.5 h-2.5 text-white/50" />
          <span>{style.subLabel}</span>
        </span>
      </div>

      {/* Mini glowing live broadcast icon */}
      <div className="absolute bottom-1 right-1.5 z-10 flex items-center gap-1 bg-black/40 px-1 rounded text-[7px] font-bold text-gray-400 select-none uppercase tracking-wide border border-white/5">
        <span className={`h-1.5 w-1.5 rounded-full ${style.accent} ${isCurrent ? 'animate-ping' : ''}`} />
        <span>#{channelNum || 'TV'}</span>
      </div>

      {/* Decorative vertical category color strip on left edge */}
      <div className={`absolute top-0 bottom-0 left-0 w-1 ${style.accent} opacity-70`}></div>
    </div>
  );
};
