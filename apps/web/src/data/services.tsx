import React from "react";

export interface Service {
  id: number;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  image: string;
  icon: React.ReactNode;
  features: string[];
  projectIds: string[];
}

/**
 * Empty export preserved for type compatibility.
 * All services are now fetched dynamically from the database via apps/api (/services).
 */
export const services: Service[] = [];
