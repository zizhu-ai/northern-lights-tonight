import type { Metadata } from "next";

import { NotFoundContent } from "@/components/not-found-content";
import copy from "@/content/ui-copy.json";

export const metadata: Metadata = {
  title: copy.not_found.title,
  robots: { index: false, follow: false },
};

export default function BostonForecastNotFound() {
  return <NotFoundContent variant="boston" />;
}
