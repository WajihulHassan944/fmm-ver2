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
    },
  },
];

export default eslintConfig;
