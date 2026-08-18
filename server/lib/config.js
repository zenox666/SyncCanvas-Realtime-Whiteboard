/**
 * Configuration parsing.
 */

/**
 * Turn the CORS_ORIGIN environment variable into a value the cors middleware
 * understands.
 *
 * The middleware treats the string "*" as "allow any origin", but treats an
 * array as an exact-match allow-list. Splitting an explicit "*" into ["*"]
 * would therefore reject every request rather than accept them, so a wildcard
 * anywhere in the list collapses back to the string form.
 *
 * @param {string|undefined} value Raw environment variable.
 * @returns {string|string[]} "*" to allow any origin, or an allow-list.
 */
export function parseCorsOrigin(value) {
  if (typeof value !== "string") return "*";

  const origins = value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0 || origins.includes("*")) return "*";

  return origins;
}
