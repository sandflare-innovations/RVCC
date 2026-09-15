/**
 * PM2 process list for a VPS deploy.
 * Ports match local/dev: web 3000, admin 3001, vendor 3002, procurement 3003, api 4000.
 *
 * Put env files on the server only (never commit them):
 *   apps/api/.env
 *   apps/web/.env.production
 *   apps/admin/.env.production
 *   apps/vendor/.env.production
 *   apps/procurement/.env.production
 *
 * Reload after a build:
 *   pm2 startOrReload ecosystem.config.cjs --update-env
 */
module.exports = {
  apps: [
    {
      name: "rvcc-api",
      cwd: __dirname + "/apps/api",
      script: "pnpm",
      args: "start",
      interpreter: "none",
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        PORT: "4000",
      },
    },
    {
      name: "rvcc-web",
      cwd: __dirname + "/apps/web",
      script: "pnpm",
      args: "start",
      interpreter: "none",
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "rvcc-admin",
      cwd: __dirname + "/apps/admin",
      script: "pnpm",
      args: "start",
      interpreter: "none",
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "rvcc-vendor",
      cwd: __dirname + "/apps/vendor",
      script: "pnpm",
      args: "start",
      interpreter: "none",
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "rvcc-procurement",
      cwd: __dirname + "/apps/procurement",
      script: "pnpm",
      args: "start",
      interpreter: "none",
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
