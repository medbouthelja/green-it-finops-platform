const AuroraBackground = ({ className = '' }) => {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div className="absolute inset-0 bg-slate-950/95" />
      <div className="absolute -top-40 -left-20 h-[28rem] w-[28rem] rounded-full bg-violet-500/30 blur-3xl animate-[aurora_20s_ease-in-out_infinite]" />
      <div className="absolute top-1/4 -right-24 h-[26rem] w-[26rem] rounded-full bg-cyan-400/30 blur-3xl animate-[aurora_26s_ease-in-out_infinite_reverse]" />
      <div className="absolute -bottom-24 left-1/3 h-[24rem] w-[24rem] rounded-full bg-emerald-400/25 blur-3xl animate-[aurora_24s_ease-in-out_infinite]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.10),transparent_55%)]" />
    </div>
  );
};

export default AuroraBackground;
