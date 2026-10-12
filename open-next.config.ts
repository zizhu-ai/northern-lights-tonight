import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

// Time-based ISR (`revalidate = 600` on `/`, `/forecast/*`, and
// `/guides/where-to-see-northern-lights`) needs a durable incremental cache
// plus a queue so revalidations de-dupe across isolates. Cache interception
// is left off: it is incompatible with PPR and is not required for this
// site's ISR set. Tag cache / cache-purge are omitted because nothing calls
// revalidateTag or revalidatePath.
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: doQueue,
  enableCacheInterception: false,
});
