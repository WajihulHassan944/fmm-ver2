import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextVitals,
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      "react/react-in-jsx-scope": "off",
      "no-unused-vars": "off",
      "no-console": "off",
      "no-debugger": "off",
      "react-hooks/set-state-in-effect": "off",
      // Legacy pages predate the React Compiler. Keep the lint gate useful
      // while those components are migrated instead of failing every release
      // on compiler-only purity diagnostics.
      "react-hooks/immutability": "off",
      "react-hooks/static-components": "off",
      "react-hooks/purity": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];

export default eslintConfig;
