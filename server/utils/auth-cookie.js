const AUTH_COOKIE_NAME = "auth-token";
const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

const isProduction = process.env.NODE_ENV === "production";

const parseCookieHeader = (cookieHeader = "") => {
  return cookieHeader.split(";").reduce((acc, part) => {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey) return acc;
    acc[rawKey] = rawValue.join("=");
    return acc;
  }, {});
};

const getAuthTokenFromCookieHeader = (cookieHeader = "") => {
  const cookies = parseCookieHeader(cookieHeader);
  return cookies[AUTH_COOKIE_NAME] || "";
};

const getAuthCookieOptions = ({ includeMaxAge = true } = {}) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
  ...(includeMaxAge ? { maxAge: AUTH_COOKIE_MAX_AGE } : {}),
});

module.exports = {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE,
  getAuthCookieOptions,
  getAuthTokenFromCookieHeader,
  parseCookieHeader,
};
