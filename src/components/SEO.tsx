import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "product" | "article";
}

const DEFAULT_TITLE = "Chitraboli চিত্রাবলী - Handmade Jewellery with Love";
const DEFAULT_DESCRIPTION = "Chitraboli creates handmade jewellery inspired by art, tradition and passion. Discover unique rings, necklaces, earrings and bangles crafted with love in Bangladesh.";
const DEFAULT_IMAGE = "https://lovable.dev/opengraph-image-p98pqg.png";
const DEFAULT_URL = "https://chitraboli.com";

export const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  image = DEFAULT_IMAGE,
  url = DEFAULT_URL,
  type = "website",
}: SEOProps) => {
  const fullTitle = title ? `${title} | Chitraboli` : DEFAULT_TITLE;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Update meta tags
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

    // Standard meta tags
    updateMetaTag("description", description);
    if (keywords) {
      updateMetaTag("keywords", keywords);
    }

    // Open Graph tags
    updateMetaTag("og:title", fullTitle, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:image", image, true);
    updateMetaTag("og:url", url, true);
    updateMetaTag("og:type", type, true);

    // Twitter Card tags
    updateMetaTag("twitter:title", fullTitle);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", image);

    // Cleanup - reset to defaults when component unmounts
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [fullTitle, description, keywords, image, url, type]);

  return null;
};
