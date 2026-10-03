type RouteLoader = () => Promise<unknown>;

export const routeLoaders = {
  home: () => import("@/pages/Index"),
  shop: () => import("@/pages/Shop"),
  product: () => import("@/pages/ProductDetail"),
  collections: () => import("@/pages/Collections"),
  about: () => import("@/pages/About"),
  contact: () => import("@/pages/Contact"),
  trackOrder: () => import("@/pages/TrackOrder"),
  paymentReturn: () => import("@/pages/PaymentReturn"),
  profile: () => import("@/pages/Profile"),
  admin: () => import("@/pages/Admin"),
  auth: () => import("@/pages/Auth"),
  resetPassword: () => import("@/pages/ResetPassword"),
  trust: () => import("@/pages/Trust"),
  blog: () => import("@/pages/BlogIdentifyingHandcraftedJewelry"),
  notFound: () => import("@/pages/NotFound"),
} satisfies Record<string, RouteLoader>;

const getLoader = (pathname: string): RouteLoader | undefined => {
  if (pathname === "/") return routeLoaders.home;
  if (pathname === "/shop") return routeLoaders.shop;
  if (pathname.startsWith("/product/")) return routeLoaders.product;
  if (pathname === "/collections") return routeLoaders.collections;
  if (pathname === "/about") return routeLoaders.about;
  if (pathname === "/contact") return routeLoaders.contact;
  if (pathname === "/track-order") return routeLoaders.trackOrder;
  if (pathname === "/payment/return") return routeLoaders.paymentReturn;
  if (pathname === "/profile") return routeLoaders.profile;
  if (pathname === "/localhost-69") return routeLoaders.admin;
  if (pathname === "/auth") return routeLoaders.auth;
  if (pathname === "/reset-password") return routeLoaders.resetPassword;
  if (pathname === "/trust") return routeLoaders.trust;
  if (pathname === "/blog/identifying-handcrafted-jewelry") return routeLoaders.blog;
  return undefined;
};

export const preloadRoute = (pathname: string) => {
  const loader = getLoader(pathname);
  if (loader) void loader();
};