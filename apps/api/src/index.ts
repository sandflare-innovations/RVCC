import { serve } from "@hono/node-server";

import { createApp } from "./app";
import { loadEnv } from "./config/env";
import { processExpiredRequirements } from "./modules/bidding/deadline-worker";
import { syncExchangeRates } from "./modules/bidding/fx";

const env = loadEnv();
const app = createApp(env);

serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    console.log(`[api] listening on http://localhost:${info.port}`);
    console.log(`[api] mounts: /admin /vendor /enquire /health`);

    // Run initial checks and periodic background tasks in Node runtime
    void processExpiredRequirements(env);
    void syncExchangeRates().catch(() => {});

    // Periodic check every 60 seconds
    setInterval(() => {
      void processExpiredRequirements(env);
    }, 60_000);
  }
);
