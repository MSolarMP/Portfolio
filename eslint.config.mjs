import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Modular monolith boundaries (PROJECT_PLAN §4.13). From outside a module, only its public
  // entry points may be imported: `@/modules/<area>` (index), `<area>.actions` (server actions
  // for forms) and `<area>.schema` (Zod contracts). Services, repositories and helpers stay private.
  // Inside a module, files import each other with relative paths, which this rule ignores.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/*/*", "!@/modules/*/*.actions", "!@/modules/*/*.schema"],
              message:
                "Import a module through its public API: @/modules/<area>, <area>.actions or <area>.schema.",
            },
            {
              group: ["@/db", "@/db/*"],
              importNames: ["db"],
              message:
                "Only repositories (src/modules/*/*.repository.ts) may use the Prisma client.",
            },
          ],
        },
      ],
    },
  },
  {
    // Repositories (and the db folder itself, seeds and tests) are allowed to use Prisma directly.
    files: [
      "src/modules/*/*.repository.ts",
      "src/modules/auth/auth.ts", // Better Auth's Prisma adapter
      "src/db/**",
      "src/**/*.test.{ts,tsx}",
    ],
    rules: { "no-restricted-imports": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated Prisma client
    "src/generated/**",
  ]),
]);

export default eslintConfig;
