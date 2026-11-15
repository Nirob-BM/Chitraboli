import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  /** Absolute or path-relative URL for this page. Defaults to the current route. */
  url?: string;
  type?: "website" | "product" | "article";
}

const SITE_ORIGIN = "https://chitraboli.lovable.app";
const DEFAULT_TITLE = "Chitraboli — Handmade with Love | Handcrafted Jewellery Bangladesh";
const DEFAULT_SOCIAL_TITLE = "Chitraboli — Handcrafted Jewellery from Bangladesh";
const DEFAULT_DESCRIPTION =
  "Discover Chitraboli — handcrafted jewellery made with love in Bangladesh. Unique artisan rings, necklaces, earrings & bangles for every special moment.";
const DEFAULT_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/96110fad-0606-4610-a360-41ee1d1eb0aa";

export const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  image = DEFAULT_IMAGE,
  url,
  type = "website",
}: SEOProps) => {
  const { pathname, search } = useLocation();
  const fullTitle = title ? `${title} | Chitraboli` : DEFAULT_TITLE;

  // Resolve canonical/og:url. If caller passed an absolute URL, use it.
  // Otherwise self-reference the current route on the production origin.
  const resolvedUrl = url
    ? /^https?:\/\//i.test(url)
      ? url
      : `${SITE_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`
    : `${SITE_ORIGIN}${pathname}${search || ""}`;

  useEffect(() => {
    document.title = fullTitle;

    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      if (element) {
        element.content = content;
      } else {
        element = document.createElement("meta");
        if (isProperty) {
          element.setAttribute("property", name);
        } else {
          element.setAttribute("name", name);
        }
        element.content = content;
        document.head.appendChild(element);
      }
    };

    const updateCanonical = (href: string) => {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", href);
    };

    updateMetaTag("description", description);
    if (keywords) {
      updateMetaTag("keywords", keywords);
    }

    // Canonical self-references this route
    updateCanonical(resolvedUrl);

    // Open Graph
    const socialTitle = title ? fullTitle : DEFAULT_SOCIAL_TITLE;
    updateMetaTag("og:title", socialTitle, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:image", image, true);
    updateMetaTag("og:url", resolvedUrl, true);
    updateMetaTag("og:type", type, true);

    // Twitter
    updateMetaTag("twitter:title", socialTitle);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", image);

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [fullTitle, description, keywords, image, resolvedUrl, type]);

  return null;
};
