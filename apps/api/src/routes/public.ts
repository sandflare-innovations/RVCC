import { Hono } from "hono";
import type { Env } from "../config/env";
import { handlePublicCareersRequest } from "../modules/careers/controllers/careers.public.controller";
import { handlePublicHeroRequest } from "../modules/content/hero/hero.controller";
import { handlePublicClientsRequest } from "../modules/content/clients/clients.controller";
import { handlePublicSisterCompaniesRequest } from "../modules/content/companies/companies.controller";
import { handlePublicProjectsRequest } from "../modules/content/projects/projects.controller";
import { handlePublicServicesRequest } from "../modules/content/services/services.controller";
import { handlePublicGalleryRequest } from "../modules/content/gallery/gallery.controller";
import { handlePublicMediaRequest } from "../modules/content/media/media.controller";
import { handlePublicDocumentsRequest } from "../modules/documents/controllers/documents.public.controller";
import {
  handlePublicNewsGet,
  handlePublicNewsList,
} from "../modules/content/news/news.controller";

export function createPublicRouter(env: Env) {
  const router = new Hono();

  router.all("/careers", (c) => handlePublicCareersRequest(c.req.raw, env));
  router.all("/careers/apply", (c) => handlePublicCareersRequest(c.req.raw, env));

  router.all("/hero-slides", (c) => handlePublicHeroRequest(c.req.raw, env));

  router.all("/clients", (c) => handlePublicClientsRequest(c.req.raw, env));

  router.all("/sister-companies", (c) => handlePublicSisterCompaniesRequest(c.req.raw, env));

  router.all("/projects", (c) => handlePublicProjectsRequest(c.req.raw, env));
  router.all("/projects/*", (c) => handlePublicProjectsRequest(c.req.raw, env));

  router.all("/services", (c) => handlePublicServicesRequest(c.req.raw, env));
  router.all("/services/*", (c) => handlePublicServicesRequest(c.req.raw, env));

  router.all("/gallery", (c) => handlePublicGalleryRequest(c.req.raw, env));

  router.all("/media/:id", (c) => handlePublicMediaRequest(c.req.raw, env, c.req.param("id")));

  router.all("/news", (c) => handlePublicNewsList(c.req.raw, env));
  router.all("/news/*", (c) => {
    const slug = c.req.path.replace(/^\/news\/?/, "");
    return handlePublicNewsGet(c.req.raw, env, slug);
  });

  router.all("/documents", (c) => handlePublicDocumentsRequest(c.req.raw, env));
  router.all("/documents/*", (c) => {
    const slug = c.req.path.replace(/^\/documents\/?/, "");
    return handlePublicDocumentsRequest(c.req.raw, env, slug);
  });

  return router;
}
