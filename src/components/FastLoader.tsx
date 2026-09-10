import RealtyLogo from "@/components/RealtyLogo";

export default function FastLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f5ef]" role="status" aria-label="Loading">
      <div className="flex flex-col items-center gap-4">
        <RealtyLogo size="sm" />
        <div className="h-1 w-32 overflow-hidden rounded-full bg-[#e3dccf]">
          <div className="h-full w-1/3 animate-[loading-bar_1.1s_ease-in-out_infinite] rounded-full bg-[#17453b]" />
        </div>
      </div>
      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[loading-bar_1\\.1s_ease-in-out_infinite\\] { animation: none; width: 100%; }
        }
      `}</style>
    </div>
  );
}
