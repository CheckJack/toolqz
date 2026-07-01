export function FooterWordmark() {
  return (
    <div
      className="footer-wordmark pointer-events-none absolute inset-x-0 bottom-0 z-0 flex justify-center overflow-hidden"
      aria-hidden
    >
      <p className="footer-wordmark-text translate-y-[28%] select-none whitespace-nowrap font-semibold leading-none tracking-[-0.045em]">
        <span className="footer-wordmark-tool">TOOL</span>
        <span className="footer-wordmark-qz">QZ</span>
      </p>
    </div>
  );
}
