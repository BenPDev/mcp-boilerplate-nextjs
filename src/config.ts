import { z } from "zod";

const pluginOriginSchema = z
  .string()
  .trim()
  .url()
  .transform((value) => new URL(value))
  .superRefine((url, context) => {
    if (url.protocol !== "https:") {
      context.addIssue({
        code: "custom",
        message: "PLUGIN_ORIGIN must use HTTPS.",
      });
    }

    if (
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      url.username ||
      url.password
    ) {
      context.addIssue({
        code: "custom",
        message:
          "PLUGIN_ORIGIN must be an origin only, without a path, query, fragment, or credentials.",
      });
    }
  })
  .transform((url) => url.origin);

export type PluginConfig = {
  origin: string;
  environment: "development" | "test" | "production";
};

/**
 * Returns the dedicated, stable widget origin. Production never guesses this
 * value from deployment provider variables: that behavior can produce broken
 * resources such as https://undefined/_next/....
 */
export function getPluginConfig(): PluginConfig {
  const environment =
    process.env.NODE_ENV === "production"
      ? "production"
      : process.env.NODE_ENV === "test"
        ? "test"
        : "development";
  const configuredOrigin = process.env.PLUGIN_ORIGIN;

  if (!configuredOrigin) {
    if (environment === "production") {
      throw new Error(
        "PLUGIN_ORIGIN is required for a production build and runtime. Set it to the stable HTTPS origin that hosts this plugin.",
      );
    }

    return { origin: "http://localhost:3000", environment };
  }

  return { origin: pluginOriginSchema.parse(configuredOrigin), environment };
}

export function validateProductionConfig(): void {
  if (process.env.NODE_ENV === "production") {
    getPluginConfig();
  }
}
