import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden font-vcr px-4 bg-darkblue">
      {/* Scanlines */}
      <div className="absolute inset-0 z-0 pointer-events-none vhs-scanlines" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg w-full">
        <div className="mb-6 px-5 py-2 text-xs tracking-[3px] text-vhs-muted border border-fear/40 rounded-sm">
          Error 404
        </div>

        <h1 className="text-7xl md:text-9xl font-black tracking-tight text-fear">
          404
        </h1>

        <h2 className="mt-4 text-2xl md:text-4xl font-bold tracking-[2px] text-vhs-white">
          Page not found
        </h2>

        <p className="mt-4 text-sm tracking-wider leading-relaxed text-vhs-muted">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
          <Link
            href="/"
            className="w-full sm:w-auto rounded-sm bg-fear px-8 py-3 text-xs font-bold tracking-[3px] text-white hover:brightness-110 transition-all text-center"
          >
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
