import { Hono } from "hono";
import type { Env } from "../../config/env";
import {
  handleAdminHeroSlideCreate,
  handleAdminHeroSlideDelete,
  handleAdminHeroSlideGet,
  handleAdminHeroSlidesList,
  handleAdminHeroSlidesReorder,
  handleAdminHeroSlideUpdate,
  handlePublicHeroRequest,
} from "./hero/hero.controller";
import {
  handleAdminClientCreate,
  handleAdminClientDelete,
  handleAdminClientGet,
  handleAdminClientsList,
  handleAdminClientsReorder,
  handleAdminClientUpdate,
  handlePublicClientsRequest,
} from "./clients/clients.controller";
import {
  handleAdminCompanyCreate,
  handleAdminCompanyDelete,
  handleAdminCompanyGet,
  handleAdminCompaniesList,
  handleAdminCompaniesReorder,
  handleAdminCompanyUpdate,
  handlePublicSisterCompaniesRequest,
} from "./companies/companies.controller";
import {
  handleAdminProjectCreate,
  handleAdminProjectDelete,
  handleAdminProjectGet,
  handleAdminProjectsList,
  handleAdminProjectsReorder,
  handleAdminProjectUpdate,
  handlePublicProjectsRequest,
} from "./projects/projects.controller";
import {
  handleAdminServiceCreate,
  handleAdminServiceDelete,
  handleAdminServiceGet,
  handleAdminServicesList,
  handleAdminServicesReorder,
  handleAdminServiceUpdate,
  handlePublicServicesRequest,
} from "./services/services.controller";
import {
  handleAdminNewsCreate,
  handleAdminNewsDelete,
  handleAdminNewsGet,
  handleAdminNewsList,
  handleAdminNewsReorder,
  handleAdminNewsUpdate,
} from "./news/news.controller";

import {
  handleAdminGalleryImageCreate,
  handleAdminGalleryImageDelete,
  handleAdminGalleryImageGet,
  handleAdminGalleryImagesList,
  handleAdminGalleryImagesReorder,
  handleAdminGalleryImageUpdate,
  handlePublicGalleryRequest,
} from "./gallery/gallery.controller";
import {
  handleAdminContentMediaUpload,
  handlePublicMediaRequest,
} from "./media/media.controller";

export function createContentPublicRouter(env: Env) {
  const router = new Hono();

  router.all("/hero-slides", (c) => handlePublicHeroRequest(c.req.raw, env));
  router.all("/clients", (c) => handlePublicClientsRequest(c.req.raw, env));
  router.all("/sister-companies", (c) => handlePublicSisterCompaniesRequest(c.req.raw, env));
  router.all("/projects", (c) => handlePublicProjectsRequest(c.req.raw, env));
  router.all("/projects/*", (c) => handlePublicProjectsRequest(c.req.raw, env));
  router.all("/services", (c) => handlePublicServicesRequest(c.req.raw, env));
  router.all("/services/*", (c) => handlePublicServicesRequest(c.req.raw, env));
  router.all("/gallery", (c) => handlePublicGalleryRequest(c.req.raw, env));
  router.all("/media/:id", (c) => handlePublicMediaRequest(c.req.raw, env, c.req.param("id")));

  return router;
}

export function createContentAdminRouter(env: Env) {
  const router = new Hono();

  // Media
  router.post("/media/upload", (c) => handleAdminContentMediaUpload(null, env, c.req.raw));

  // Hero
  router.get("/hero-slides", (c) => handleAdminHeroSlidesList(null, env, c.req.raw));
  router.post("/hero-slides", (c) => handleAdminHeroSlideCreate(null, env, c.req.raw));
  router.post("/hero-slides/reorder", (c) => handleAdminHeroSlidesReorder(null, env, c.req.raw));
  router.get("/hero-slides/:id", (c) => handleAdminHeroSlideGet(null, env, c.req.raw, c.req.param("id")));
  router.put("/hero-slides/:id", (c) => handleAdminHeroSlideUpdate(null, env, c.req.raw, c.req.param("id")));
  router.delete("/hero-slides/:id", (c) => handleAdminHeroSlideDelete(null, env, c.req.raw, c.req.param("id")));

  // Clients
  router.get("/clients", (c) => handleAdminClientsList(null, env, c.req.raw));
  router.post("/clients", (c) => handleAdminClientCreate(null, env, c.req.raw));
  router.post("/clients/reorder", (c) => handleAdminClientsReorder(null, env, c.req.raw));
  router.get("/clients/:id", (c) => handleAdminClientGet(null, env, c.req.raw, c.req.param("id")));
  router.put("/clients/:id", (c) => handleAdminClientUpdate(null, env, c.req.raw, c.req.param("id")));
  router.delete("/clients/:id", (c) => handleAdminClientDelete(null, env, c.req.raw, c.req.param("id")));

  // Companies
  router.get("/companies", (c) => handleAdminCompaniesList(null, env, c.req.raw));
  router.post("/companies", (c) => handleAdminCompanyCreate(null, env, c.req.raw));
  router.post("/companies/reorder", (c) => handleAdminCompaniesReorder(null, env, c.req.raw));
  router.get("/companies/:id", (c) => handleAdminCompanyGet(null, env, c.req.raw, c.req.param("id")));
  router.put("/companies/:id", (c) => handleAdminCompanyUpdate(null, env, c.req.raw, c.req.param("id")));
  router.delete("/companies/:id", (c) => handleAdminCompanyDelete(null, env, c.req.raw, c.req.param("id")));

  // Projects
  router.get("/projects", (c) => handleAdminProjectsList(null, env, c.req.raw));
  router.post("/projects", (c) => handleAdminProjectCreate(null, env, c.req.raw));
  router.post("/projects/reorder", (c) => handleAdminProjectsReorder(null, env, c.req.raw));
  router.get("/projects/:id", (c) => handleAdminProjectGet(null, env, c.req.raw, c.req.param("id")));
  router.put("/projects/:id", (c) => handleAdminProjectUpdate(null, env, c.req.raw, c.req.param("id")));
  router.delete("/projects/:id", (c) => handleAdminProjectDelete(null, env, c.req.raw, c.req.param("id")));

  // Services
  router.get("/services", (c) => handleAdminServicesList(null, env, c.req.raw));
  router.post("/services", (c) => handleAdminServiceCreate(null, env, c.req.raw));
  router.post("/services/reorder", (c) => handleAdminServicesReorder(null, env, c.req.raw));
  router.get("/services/:id", (c) => handleAdminServiceGet(null, env, c.req.raw, c.req.param("id")));
  router.put("/services/:id", (c) => handleAdminServiceUpdate(null, env, c.req.raw, c.req.param("id")));
  router.delete("/services/:id", (c) => handleAdminServiceDelete(null, env, c.req.raw, c.req.param("id")));

  // Gallery
  router.get("/gallery", (c) => handleAdminGalleryImagesList(null, env, c.req.raw));
  router.post("/gallery", (c) => handleAdminGalleryImageCreate(null, env, c.req.raw));
  router.post("/gallery/reorder", (c) => handleAdminGalleryImagesReorder(null, env, c.req.raw));
  router.get("/gallery/:id", (c) => handleAdminGalleryImageGet(null, env, c.req.raw, c.req.param("id")));
  router.put("/gallery/:id", (c) => handleAdminGalleryImageUpdate(null, env, c.req.raw, c.req.param("id")));
  router.delete("/gallery/:id", (c) => handleAdminGalleryImageDelete(null, env, c.req.raw, c.req.param("id")));

  // News & Events
  router.get("/news", (c) => handleAdminNewsList(null, env, c.req.raw));
  router.post("/news", (c) => handleAdminNewsCreate(null, env, c.req.raw));
  router.post("/news/reorder", (c) => handleAdminNewsReorder(null, env, c.req.raw));
  router.get("/news/:id", (c) => handleAdminNewsGet(null, env, c.req.raw, c.req.param("id")));
  router.put("/news/:id", (c) => handleAdminNewsUpdate(null, env, c.req.raw, c.req.param("id")));
  router.delete("/news/:id", (c) => handleAdminNewsDelete(null, env, c.req.raw, c.req.param("id")));

  return router;
}
