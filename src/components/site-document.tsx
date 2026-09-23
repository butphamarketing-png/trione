"use client";

import { useEffect, useSyncExternalStore } from "react";
import { facebookPixelId, readPageSeo, subscribePageSeo, useSiteSettings } from "@/lib/site-settings";

function usePageSeo() {
  return useSyncExternalStore(subscribePageSeo, readPageSeo, () => null);
}

function meta(name: string, content: string, attr: "name" | "property" = "name") {
  const selector = `meta[${attr}="${name}"]`;
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!content) {
    tag?.remove();
    return;
  }
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function canonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[data-site-canonical="1"]');
  if (!href) {
    link?.remove();
    return;
  }
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    link.dataset.siteCanonical = "1";
    document.head.appendChild(link);
  }
  link.href = href;
}

export function SiteDocument() {
  const site = useSiteSettings();
  const page = usePageSeo();

  useEffect(() => {
    const title = page?.title || site.seoTitle;
    const description = page?.description || site.description;
    const keywords = page?.keywords || site.keywords;
    const link = page?.canonical || site.canonical || site.website;
    if (title) {
      document.title = title;
      window.setTimeout(() => {
        document.title = title;
      }, 50);
    }
    meta("description", description);
    meta("keywords", keywords);
    meta("robots", site.robots === "noindex" ? "noindex,nofollow" : "index,follow");
    meta("og:title", title, "property");
    meta("og:description", description, "property");
    meta("og:type", site.ogType || "website", "property");
    meta("og:url", link, "property");
    meta("og:site_name", site.ogSite || site.company, "property");
    canonical(link);

    const current = document.querySelector<HTMLLinkElement>('link[data-site-favicon="1"]');
    if (!site.favicon) current?.remove();
    else {
      const icon = current ?? document.createElement("link");
      icon.rel = "icon";
      icon.dataset.siteFavicon = "1";
      icon.href = site.favicon;
      if (!current) document.head.appendChild(icon);
    }

    const pixelId = facebookPixelId(site.facebookPixel);
    const existing = document.getElementById("trione-fb-pixel");
    if (!pixelId) {
      existing?.remove();
      return;
    }
    if (existing?.dataset.pixel === pixelId) return;
    existing?.remove();
    const script = document.createElement("script");
    script.id = "trione-fb-pixel";
    script.dataset.pixel = pixelId;
    script.text = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`;
    document.head.appendChild(script);
  }, [site, page]);

  return null;
}
