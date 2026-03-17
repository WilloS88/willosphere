import type React from "react";
import type { Album, MerchItem } from "@/lib/store-data";
import { Shirt, Image, Tag, Pin, Sparkles, Package } from "lucide-react";


function Scene_Skyline() {
  return <>
    <div className="absolute bottom-0 left-0 right-0 h-[60%]">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="absolute bottom-0 border-t border-vhs-cyan/25" style={{ left: `${i * 13}%`, width: `${12 + ((i * 3) % 7)}%`, height: `${30 + ((i * 17) % 55)}%`, background: "linear-gradient(180deg, rgba(0,229,255,0.13), rgba(11,15,45,0.67))" }} />
      ))}
    </div>
    <div className="absolute rounded-full" style={{ top: "15%", right: "15%", width: 40, height: 40, background: "radial-gradient(#f4e526, rgba(237,44,94,0.25))", boxShadow: "0 0 30px rgba(244,229,38,0.25)" }} />
  </>;
}

function Scene_Spiral({ color }: { color: string }) {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%]">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="absolute top-1/2 left-1/2 rounded-full" style={{ transform: `translate(-50%,-50%) rotate(${i * 30}deg)`, width: `${90 - i * 12}%`, height: `${90 - i * 12}%`, border: `1px solid ${color}${40 + i * 10}` }} />
      ))}
    </div>
  );
}

function Scene_Sunset() {
  return <>
    <div className="absolute bottom-0 left-0 right-0 h-[45%]" style={{ background: "linear-gradient(180deg, transparent, rgba(237,44,94,0.2), rgba(244,229,38,0.13))" }} />
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="absolute left-0 right-0 h-px" style={{ bottom: `${i * 5 + 2}%`, background: `rgba(237,44,94,${0.08 + i * 0.03})` }} />
    ))}
    <div className="absolute rounded-full" style={{ top: "20%", left: "50%", transform: "translateX(-50%)", width: 60, height: 60, background: "radial-gradient(rgba(244,229,38,0.67), rgba(237,44,94,0.25), transparent)" }} />
  </>;
}

function Scene_Mountains() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
      <polygon points="10,90 50,20 90,90" fill="none" stroke="rgba(0,229,255,0.27)" strokeWidth="0.5" />
      <polygon points="25,90 55,35 85,90" fill="none" stroke="rgba(155,89,255,0.27)" strokeWidth="0.5" />
      <line x1="0" y1="90" x2="100" y2="90" stroke="rgba(0,229,255,0.2)" strokeWidth="0.5" />
    </svg>
  );
}

function Scene_Grid() {
  return <>
    <div className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden" style={{ perspective: 200 }}>
      <div className="w-full h-full origin-bottom" style={{ background: "repeating-linear-gradient(90deg, rgba(0,255,136,0.13) 0px, transparent 1px, transparent 20px), repeating-linear-gradient(0deg, rgba(0,255,136,0.13) 0px, transparent 1px, transparent 20px)", transform: "rotateX(60deg)" }} />
    </div>
    <div className="absolute rounded-full" style={{ top: "15%", left: "50%", transform: "translateX(-50%)", width: 50, height: 50, background: "radial-gradient(rgba(0,255,136,0.4), transparent)" }} />
  </>;
}

function Scene_Spheres({ color }: { color: string }) {
  return <>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="absolute rounded-full" style={{ top: `${20 + (i % 2) * 30}%`, left: `${15 + i * 20}%`, width: `${25 + i * 5}px`, height: `${25 + i * 5}px`, background: `radial-gradient(circle at 35% 35%, ${color}88, ${color}22, transparent)`, boxShadow: `0 4px 15px ${color}22` }} />
    ))}
  </>;
}

function Scene_Rain() {
  return <>
    {Array.from({ length: 12 }).map((_, i) => (
      <div key={i} className="absolute font-mono text-[8px] tracking-widest" style={{ top: `${(i * 7) % 80}%`, left: `${i * 8 + 2}%`, color: `rgba(237,44,94,${0.12 + (i * 0.02) % 0.15})`, writingMode: "vertical-rl" }}>
        {String.fromCharCode(0x30a0 + ((i * 13) % 96))}
      </div>
    ))}
  </>;
}

function Scene_Waves() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
      {Array.from({ length: 5 }).map((_, i) => (
        <path key={i} d={`M 0 ${50 + i * 8} Q 25 ${40 + i * 8} 50 ${50 + i * 8} Q 75 ${60 + i * 8} 100 ${50 + i * 8}`} fill="none" stroke={`rgba(155,89,255,${0.12 + i * 0.04})`} strokeWidth="0.8" />
      ))}
    </svg>
  );
}

const SCENES = [Scene_Skyline, Scene_Spiral, Scene_Sunset, Scene_Mountains, Scene_Grid, Scene_Spheres, Scene_Rain, Scene_Waves];

const GRADIENTS = [
  "linear-gradient(135deg, #253078 0%, rgba(0,229,255,0.27) 50%, #0b0f2d 100%)",
  "linear-gradient(135deg, rgba(155,89,255,0.53) 0%, #253078 50%, #0b0f2d 100%)",
  "linear-gradient(135deg, rgba(237,44,94,0.4) 0%, #253078 50%, #0b0f2d 100%)",
  "linear-gradient(135deg, rgba(244,229,38,0.27) 0%, rgba(237,44,94,0.27) 50%, #0b0f2d 100%)",
  "linear-gradient(135deg, rgba(0,255,136,0.27) 0%, rgba(0,229,255,0.2) 50%, #0b0f2d 100%)",
  "linear-gradient(135deg, rgba(0,229,255,0.27) 0%, rgba(155,89,255,0.27) 50%, #0b0f2d 100%)",
  "linear-gradient(135deg, rgba(237,44,94,0.33) 0%, rgba(155,89,255,0.2) 50%, #0b0f2d 100%)",
  "linear-gradient(135deg, rgba(155,89,255,0.33) 0%, rgba(0,229,255,0.27) 50%, #0b0f2d 100%)",
];

export function AlbumCover({ album, index }: { album: Album; index: number }) {
  const Scene = SCENES[index % SCENES.length];
  return (
    <div className="w-full aspect-square rounded overflow-hidden relative" style={{ background: GRADIENTS[index % GRADIENTS.length], border: `1px solid ${album.color}22` }}>
      <Scene color={album.color} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
    </div>
  );
}

const TAG_COLORS = ["#ed2c5e", "#00e5ff", "#f4e526", "#9b59ff", "#00ff88", "#ed2c5e"];
const TAG_ICONS: Record<string, React.ReactNode> = {
  SHIRT: <Shirt size={40} />,
  POSTER: <Image size={40} />,
  CAP: <Tag size={40} />,
  PINS: <Pin size={40} />,
  STICKER: <Sparkles size={40} />,
  HOODIE: <Shirt size={40} />,
};

export function MerchCover({ item, index }: { item: MerchItem; index: number }) {
  const c = TAG_COLORS[index % TAG_COLORS.length];
  return (
    <div className="w-full aspect-square rounded overflow-hidden relative flex items-center justify-center bg-gradient-to-br from-darkblue to-royalblue" style={{ border: `1px solid ${c}22` }}>
      <div className="absolute opacity-[0.15]" style={{ color: c }}>{TAG_ICONS[item.tag] ?? <Package size={40} />}</div>
      <div className="relative z-10 px-3 py-1.5 rounded-sm text-[10px] tracking-[2px] font-vcr uppercase" style={{ border: `1px solid ${c}44`, color: c }}>{item.tag}</div>
      <div className="absolute inset-0" style={{ background: `repeating-linear-gradient(0deg, transparent, transparent 3px, ${c}06 3px, ${c}06 4px)` }} />
    </div>
  );
}
