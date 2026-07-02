import { Suspense } from "react";
import { HomePageLoading } from "@/components/HomePageLoading";
import { HomePageLoader } from "@/components/HomePageLoader";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<HomePageLoading />}>
      <HomePageLoader />
    </Suspense>
  );
}
