import { Suspense } from "react";
import { HomePageContent, HomePageFallback } from "@/components/HomePageContent";

export default function Home() {
  return (
    <Suspense fallback={<HomePageFallback />}>
      <HomePageContent />
    </Suspense>
  );
}
