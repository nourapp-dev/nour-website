import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
// Node's type stripping does not resolve the extensionless imports used by Next.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (specifier.startsWith(".") && context.parentURL?.startsWith("file:"))
        for (const suffix of [".ts", ".tsx", "/index.ts"]) {
          const url = new URL(specifier + suffix, context.parentURL);
          if (existsSync(fileURLToPath(url)))
            return nextResolve(url.href, context);
        }
      throw error;
    }
  },
});
