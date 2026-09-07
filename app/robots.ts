import type { MetadataRoute } from "next";

import { siteRobots } from "@/lib/indexing";

export default function robots(): MetadataRoute.Robots {
  return siteRobots();
}
