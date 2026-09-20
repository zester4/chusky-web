import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "node_modules/**", "out/**", "next-env.d.ts"],
    rules: {
      // The dashboard uses effects as its authenticated/server synchronization
      // boundary; the React compiler rule flags this required pattern.
      "react-hooks/set-state-in-effect": "off",
      // Several pages intentionally keep a stable load function and refresh
      // it from live-data subscriptions; those callbacks are not render deps.
      "react-hooks/exhaustive-deps": "off",
      // Provider and branding URLs are runtime data, so next/image cannot
      // safely optimize them without making arbitrary remote hosts trusted.
      "@next/next/no-img-element": "off",
      "@next/next/no-location-assign-relative-destination": "off",
    },
  },
]

export default config
