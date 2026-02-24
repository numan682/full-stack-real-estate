"use client";

import {
  createContext,
  useContext,
  type PropsWithChildren,
} from "react";
import type { CmsConfigPayload } from "@/lib/cms-api";

const defaultValue: CmsConfigPayload = {
  homeTemplate: "home_01",
  homeSections: [],
  pageSections: {},
  pages: [],
  navigation: [],
  globalSettings: {},
};

const CmsConfigContext = createContext<CmsConfigPayload>(defaultValue);

export function CmsConfigProvider({
  value,
  children,
}: PropsWithChildren<{ value: CmsConfigPayload }>) {
  return (
    <CmsConfigContext.Provider value={value}>
      {children}
    </CmsConfigContext.Provider>
  );
}

export function useCmsConfig() {
  return useContext(CmsConfigContext);
}
