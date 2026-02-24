"use client";

import { useEffect } from "react";

type ContentOverrideValue = string | {
  text?: string;
  attrs?: Record<string, string>;
};

type CmsContentOverridesProps = {
  overrides?: Record<string, unknown>;
};

function applyTextOverride(selector: string, value: ContentOverrideValue) {
  const elements = document.querySelectorAll(selector);

  for (const element of elements) {
    if (typeof value === "string") {
      element.textContent = value;
      continue;
    }

    if (typeof value.text === "string") {
      element.textContent = value.text;
    }

    if (value.attrs && typeof value.attrs === "object") {
      for (const [attributeName, attributeValue] of Object.entries(value.attrs)) {
        if (typeof attributeValue === "string") {
          element.setAttribute(attributeName, attributeValue);
        }
      }
    }
  }
}

export function CmsContentOverrides({ overrides }: CmsContentOverridesProps) {
  useEffect(() => {
    if (!overrides || typeof overrides !== "object") {
      return;
    }

    for (const [selector, rawValue] of Object.entries(overrides)) {
      if (typeof selector !== "string" || selector.trim() === "") {
        continue;
      }

      if (typeof rawValue === "string") {
        applyTextOverride(selector, rawValue);
        continue;
      }

      if (rawValue && typeof rawValue === "object") {
        const typedValue = rawValue as ContentOverrideValue;
        applyTextOverride(selector, typedValue);
      }
    }
  }, [overrides]);

  return null;
}
