export function VHSOverlay() {
  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-[9998] vhs-scanlines" />
      <div className="fixed inset-0 pointer-events-none z-[9999] vhs-noise" />
      <div className="fixed left-0 right-0 h-[2px] pointer-events-none z-[9999] animate-scan-move bg-white/5 blur-[1px]" />
    </>
  );
}
