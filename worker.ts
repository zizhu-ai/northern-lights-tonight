// Custom Worker entry: reuse the OpenNext fetch handler, add the 10-minute
// refresh cron, and re-export DOQueueHandler so wrangler deploy can bind it.
// @ts-ignore `.open-next/worker.js` is generated at build time
import { default as handler } from "./.open-next/worker.js";

const REFRESH_PATH = "/api/cron/refresh";

type WorkerExecutionContext = {
  waitUntil(promise: Promise<unknown>): void;
};

type OpenNextHandler = {
  fetch(
    request: Request,
    env: CloudflareEnv,
    ctx: WorkerExecutionContext,
  ): Promise<Response> | Response;
};

const openNext = handler as OpenNextHandler;

function refreshRequest(): Request {
  return new Request(`https://aurora-tonight.internal${REFRESH_PATH}`, {
    method: "POST",
    headers: {
      "X-Aurora-Scheduled": "1",
      "Cache-Control": "no-store",
    },
  });
}

export default {
  fetch(
    request: Request,
    env: CloudflareEnv,
    ctx: WorkerExecutionContext,
  ): Promise<Response> | Response {
    return openNext.fetch(request, env, ctx);
  },

  async scheduled(
    _controller: unknown,
    env: CloudflareEnv,
    ctx: WorkerExecutionContext,
  ): Promise<void> {
    const refresh = Promise.resolve(openNext.fetch(refreshRequest(), env, ctx)).then(
      async (response) => {
        await response.arrayBuffer();
      },
    );
    ctx.waitUntil(refresh);
    await refresh;
  },
};

// @ts-ignore `.open-next/worker.js` is generated at build time
export { DOQueueHandler } from "./.open-next/worker.js";
