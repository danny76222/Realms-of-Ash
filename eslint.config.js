import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".output", ".vinxi"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
        },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  eslintPluginPrettier,

  // ---------------------------------------------------------------------
  // Determinism gate. Borrowed from the Isles project, where the equivalent
  // rules (G1-G3) are what let an automated playtest fleet compare two runs.
  //
  // The rule files are a pure function of GameState. Every random draw comes
  // from src/game/rng.ts, seeded by GameState.seed, so a campaign replays and
  // a bug is reproducible. An unautomated gate is a hope; this is what turns
  // the rule into a build failure. Proved by scripts/determinism.ts, which is
  // shown to FAIL on an injected unseeded draw before it is trusted.
  //
  // Presentation files (music, sound, voice) are deliberately outside this:
  // nothing they do reaches saved state.
  // ---------------------------------------------------------------------
  {
    files: [
      "src/game/engine.ts",
      "src/game/state.ts",
      "src/game/progress.ts",
      "src/game/story.ts",
      "src/game/world.ts",
      "src/game/weather.ts",
    ],
    rules: {
      "no-restricted-properties": [
        "error",
        {
          object: "Math",
          property: "random",
          message:
            "unseeded: draw from the campaign stream (src/game/rng.ts). newGame is the one exception and says so.",
        },
        {
          object: "Date",
          property: "now",
          message: "wall clock leaks into saved state; use GameState.day and GameState.hour",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: 'NewExpression[callee.name="Date"]',
          message: "wall clock leaks into saved state; use GameState.day and GameState.hour",
        },
      ],
      "no-restricted-globals": [
        "error",
        { name: "document", message: "no DOM in the game rules" },
        { name: "window", message: "no DOM in the game rules" },
        { name: "performance", message: "wall clock leaks into saved state; use GameState.day" },
      ],
    },
  },

  // House style, as WARNINGS pending direction ruling 5. The lore prose uses
  // em-dashes heavily and the interface uses emoji as heraldry and icons, so
  // this reports rather than blocks until Henry and Danny rule on it. Do not
  // bulk-rewrite the prose to silence it.
  {
    files: ["src/game/**/*.ts", "src/components/game/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: "Literal[value=/\\u2014/u]",
          message: "em-dash in player-facing text (direction ruling 5 pending)",
        },
        {
          selector: "TemplateElement[value.raw=/\\u2014/u]",
          message: "em-dash in player-facing text (direction ruling 5 pending)",
        },
      ],
    },
  },
);
