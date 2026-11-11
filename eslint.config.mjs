import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // La app Expo tiene su propio lint (`expo lint`, desde mobile/); no es código Next.
    "mobile/**",
    // Las copias de trabajo que abren los agentes adentro del repositorio (`git worktree`): son
    // otras ramas, con su propio lint, y sin esto `npm run lint` en local las revisa también.
    ".claude/**",
  ]),
]);

export default eslintConfig;
