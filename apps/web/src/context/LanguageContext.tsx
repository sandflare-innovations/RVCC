"use client";

import React, { createContext, useContext } from "react";

const translations = {
  header: {
    about: "About",
    services: "Services",
    projects: "Projects",
    contacts: "Contact",
  },
};

const LanguageContext = createContext({
  t: translations,
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <LanguageContext.Provider value={{ t: translations }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
