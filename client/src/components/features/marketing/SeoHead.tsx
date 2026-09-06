import { useEffect } from "react";

interface SeoHeadProps {
  title: string;
  description: string;
  path: string;
}

const SITE_NAME = "SketchTask";

const upsertMeta = (name: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[name="${name}"]`,
  );
  if (!element) {
    element = document.createElement("meta");
    element.name = name;
    document.head.appendChild(element);
  }
  element.content = content;
};

const upsertProperty = (property: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[property="${property}"]`,
  );
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.appendChild(element);
  }
  element.content = content;
};

const upsertCanonical = (url: string) => {
  let element = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = url;
};

export const SeoHead: React.FC<SeoHeadProps> = ({ title, description, path }) => {
  useEffect(() => {
    const siteUrl = (
      import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin
    ).replace(/\/$/, "");
    const canonicalUrl = `${siteUrl}${path === "/" ? "/" : path}`;

    document.title = title;
    document.documentElement.lang = "vi";
    upsertMeta("description", description);
    upsertMeta(
      "robots",
      path.startsWith("/app") || path.startsWith("/admin")
        ? "noindex,nofollow"
        : "index,follow",
    );
    upsertProperty("og:title", title);
    upsertProperty("og:description", description);
    upsertProperty("og:type", "website");
    upsertProperty("og:url", canonicalUrl);
    upsertProperty("og:site_name", SITE_NAME);
    upsertMeta("twitter:card", "summary");
    upsertMeta("twitter:title", title);
    upsertMeta("twitter:description", description);
    upsertCanonical(canonicalUrl);

    const existingSchema = document.head.querySelector<HTMLScriptElement>(
      'script[data-seo="sketchtask"]',
    );
    const schema = existingSchema || document.createElement("script");
    schema.type = "application/ld+json";
    schema.dataset.seo = "sketchtask";
    schema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "ProductivityApplication",
      operatingSystem: "Web, Android",
      description,
      url: siteUrl,
    });
    if (!existingSchema) document.head.appendChild(schema);
  }, [description, path, title]);

  return null;
};
