import { useState } from "react";
import Image from "next/image";

const LOCAL_IMAGE_REWRITES = {
  "/images/hero-fight.png": "/images/hero-fight.webp",
  "/images/hero-fight-original.png": "/images/hero-fight-original.webp",
  "/images/fmm-pages/premium-affiliate-banner.png": "/images/fmm-pages/premium-affiliate-banner.webp",
  "/images/fmm-pages/premium-arena-banner.png": "/images/fmm-pages/premium-arena-banner.webp",
  "/images/fmm-pages/premium-duel-banner.png": "/images/fmm-pages/premium-duel-banner.webp",
  "/images/pro-wrestling/live-match.png": "/images/pro-wrestling/live-match.webp",
  "/images/pro-wrestling/live-match-mockup.png": "/images/pro-wrestling/live-match-mockup.webp",
  "/images/pro-wrestling/live-command.png": "/images/pro-wrestling/live-command.webp",
  "/images/pro-wrestling/prediction.png": "/images/pro-wrestling/prediction.webp",
  "/images/pro-wrestling/prediction-mockup.png": "/images/pro-wrestling/prediction-mockup.webp",
  "/images/pro-wrestling/prediction-command.png": "/images/pro-wrestling/prediction-command.webp",
  "/images/pro-wrestling/admin-command.png": "/images/pro-wrestling/admin-command.webp",
  "/images/pro-wrestling/wrestling-match-premium.jpg": "/images/pro-wrestling/wrestling-match-premium.webp",
  "/images/pro-wrestling/wrestling-roster-premium.jpg": "/images/pro-wrestling/wrestling-roster-premium.webp",
  "/images/pro-wrestling/wrestling-live-premium.jpg": "/images/pro-wrestling/wrestling-live-premium.webp",
  "/images/pro-wrestling/wrestling-history-premium.jpg": "/images/pro-wrestling/wrestling-history-premium.webp",
  "/images/pro-wrestling/pro-wrestling-hero.jpg": "/images/pro-wrestling/pro-wrestling-hero.webp",
  "/images/fmm-experience/fantasy-mmadness-logo.png": "/images/fmm-experience/fantasy-mmadness-logo.webp",
  "/images/fmm-experience/homepage-fight-hero.jpg": "/images/fmm-experience/homepage-fight-hero.webp",
  "/images/fmm-experience/fighter-action-red.jpg": "/images/fmm-experience/fighter-action-red.webp",
  "/images/fmm-experience/fighter-action-blue.jpg": "/images/fmm-experience/fighter-action-blue.webp",
  "/images/fmm-experience/fighter-duel-arena.jpg": "/images/fmm-experience/fighter-duel-arena.webp",
  "/images/fmm-experience/fighter-duel-panel.jpg": "/images/fmm-experience/fighter-duel-panel.webp",
};

const NEXT_IMAGE_REMOTE_HOSTS = new Set([
  "res.cloudinary.com",
  "cdn-icons-png.flaticon.com",
  "fantasymmadness-game-server-three.vercel.app",
]);

const optimizeCloudinarySrc = (src) => {
  if (!src || typeof src !== "string" || !src.includes("res.cloudinary.com") || !src.includes("/image/upload/")) return src;
  if (/\/image\/upload\/(?:[^/]+,)*f_auto/.test(src) || src.includes("/image/upload/f_auto")) return src;
  return src.replace("/image/upload/", "/image/upload/f_auto,q_auto,c_limit,w_1200/");
};

export const normalizeOptimizedImageSrc = (src) => {
  if (!src || typeof src !== "string") return src;
  return optimizeCloudinarySrc(LOCAL_IMAGE_REWRITES[src] || src);
};

export const isNextImageEligible = (src) => {
  if (!src || typeof src !== "string") return false;
  if (src.toLowerCase().endsWith(".svg")) return false;
  if (src.startsWith("/")) return true;
  if (src.startsWith("data:") || src.startsWith("blob:")) return false;

  try {
    return NEXT_IMAGE_REMOTE_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
};

const OptimizedImage = ({
  src,
  alt = "",
  width = 400,
  height = 300,
  sizes = "(max-width: 768px) 100vw, 400px",
  priority = false,
  loading,
  decoding = "async",
  fill = false,
  fallbackSrc = "",
  onError,
  ...props
}) => {
  const [failed, setFailed] = useState(false);
  const normalizedSrc = normalizeOptimizedImageSrc(failed && fallbackSrc ? fallbackSrc : src);

  const handleError = (event) => {
    if (fallbackSrc && !failed) setFailed(true);
    onError?.(event);
  };

  if (!isNextImageEligible(normalizedSrc)) {
    return (
      <img
        {...props}
        src={normalizedSrc}
        alt={alt || ""}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        loading={priority ? "eager" : loading || "lazy"}
        decoding={decoding}
        onError={handleError}
      />
    );
  }

  const imageProps = {
    src: normalizedSrc,
    alt,
    sizes,
    decoding,
    fill,
    ...props,
    onError: handleError,
  };

  if (!fill) {
    imageProps.width = width;
    imageProps.height = height;
  }

  if (priority) {
    imageProps.priority = true;
    imageProps.fetchPriority = "high";
  } else {
    imageProps.loading = loading || "lazy";
  }

  return <Image {...imageProps} alt={alt || ""} />;
};

export default OptimizedImage;
