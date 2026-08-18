import { serve } from "@hono/node-server";

import { createApp } from "./app";
import { loadEnv } from "./config/env";

import { serveStatic } from "@hono/node-server/serve-static";

const env = loadEnv();
const app = createApp(env);

// Serve uploads statically
app.use("/uploads/*", serveStatic({ root: "./" }));

serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    console.log(`[api] listening on http://localhost:${info.port}`);
    console.log(`[api] mounts: /admin /vendor /enquire /health`);
  }
);
