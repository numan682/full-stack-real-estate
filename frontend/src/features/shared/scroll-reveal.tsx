"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function collectRevealTargets() {
  const explicitTargets = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-reveal]"));
  const automaticTargets = Array.from(document.querySelectorAll<HTMLElement>(
    ".main-page-wrapper section, .main-page-wrapper .listing-card-one, .main-page-wrapper .listing-card-seven",
  ));

  automaticTargets.forEach((element) => {
    if (!element.hasAttribute("data-scroll-reveal")) {
      element.setAttribute("data-scroll-reveal", "up");
    }
  });

  return Array.from(new Set([...explicitTargets, ...automaticTargets]));
}

function markVisible(element: Element) {
  element.classList.remove("is-pending");
  element.classList.add("is-visible");
}

function isInViewport(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  return rect.bottom >= 0 && rect.top <= viewportHeight * 0.98;
}

export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const targets = collectRevealTargets();

    if (targets.length === 0) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      targets.forEach((target) => markVisible(target));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          markVisible(entry.target);
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0,
        rootMargin: "0px 0px -5% 0px",
      },
    );

    targets.forEach((target) => {
      if (!target.classList.contains("is-visible")) {
        target.classList.add("is-pending");
      }

      if (isInViewport(target)) {
        markVisible(target);
        return;
      }

      observer.observe(target);
    });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
