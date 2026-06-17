import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Background } from "@/components/layout/Background";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { AuthModal } from "@/components/auth/AuthModal";
import { PricingModal } from "@/components/pricing/PricingModal";
import { HomePage } from "@/pages/HomePage";
import { IconLoader } from "@/icons";

// Landing page loads eagerly (it's the first paint). The rest are split into
// their own chunks and fetched on demand — smaller initial download on mobile.
const ShowcasePage = lazy(() =>
  import("@/pages/ShowcasePage").then((m) => ({ default: m.ShowcasePage })),
);
const PricingPage = lazy(() =>
  import("@/pages/PricingPage").then((m) => ({ default: m.PricingPage })),
);
const ChangelogPage = lazy(() =>
  import("@/pages/ChangelogPage").then((m) => ({ default: m.ChangelogPage })),
);

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-accent-2">
      <IconLoader size={22} className="spin" />
    </div>
  );
}

/**
 * HashRouter keeps deep links working on any static host (GitHub Pages,
 * Netlify drop, plain file server) without server-side rewrites.
 */
export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <Background />
      <Navbar />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/showcase" element={<ShowcasePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/changelog" element={<ChangelogPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Footer />
      <AuthModal />
      <PricingModal />
    </HashRouter>
  );
}
