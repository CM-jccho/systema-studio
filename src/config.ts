/**
 * Pro pack storefronts.
 * Korean buyers are sent to Rapide (KRW), English buyers to Gumroad (USD).
 * Both pages sell the same ZIP, so either link is safe to follow.
 */
export const STORE_URL_KO = "https://www.latpeed.com/products/4cJga";
export const STORE_URL_EN = "https://jaechul4.gumroad.com/l/systema-pro-work-systems-pack";

/** Default fallback for any surface that has no locale split. */
export const STORE_URL = STORE_URL_EN;

export const PRO_PACK_AVAILABLE = true;

export function storeUrlFor(locale: "ko" | "en"): string {
  return locale === "ko" ? STORE_URL_KO : STORE_URL_EN;
}

export function otherStoreUrlFor(locale: "ko" | "en"): string {
  return locale === "ko" ? STORE_URL_EN : STORE_URL_KO;
}
