/**
 * GitHub Linguist language colors.
 *
 * A portfolio that shows a language distribution should be able to name its
 * bars the same way GitHub does, so the palette is the official Linguist one
 * rather than an invented ramp. Values are literal hex: they are data about a
 * language, not theme tokens, and they must stay the same in both palettes.
 */

/**
 * Stand-in for any language without an entry here. A warm paper grey, so an
 * unknown language reads as "not on the chart" instead of inventing a hue.
 */
export const DEFAULT_LANGUAGE_COLOR = '#8a8578';

export const LANGUAGE_COLORS: Record<string, string> = {
  // The languages that fill most contributor charts.
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  'F#': '#b845fc',
  Swift: '#F05138',
  'Objective-C': '#438eff',
  'Objective-C++': '#6866fb',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Sass: '#a53b70',
  Shell: '#89e051',
  Dockerfile: '#384d54',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Astro: '#ff5a03',
  Lua: '#000080',
  Perl: '#0298c3',
  Haskell: '#5e5086',
  Scala: '#c22d40',
  Elixir: '#6e4a7e',
  Erlang: '#B83998',
  Clojure: '#db5855',
  OCaml: '#ef7a08',
  Nim: '#ffc200',
  Zig: '#ec915c',
  R: '#198CE7',
  MATLAB: '#e16737',
  'Jupyter Notebook': '#DA5B0B',
  Groovy: '#4298b8',
  Solidity: '#AA6746',
  Assembly: '#6E4C13',
  Makefile: '#427819',
  Markdown: '#083fa1',
  Nix: '#7e7eff',
  TeX: '#3D6117',
  PowerShell: '#012456',
  'Emacs Lisp': '#c065db',
  'Vim Script': '#199f4b',
  YAML: '#cb171e',
  // Explicitly not a colour: the bucket the chart uses for the rest.
  Other: DEFAULT_LANGUAGE_COLOR,
};

/**
 * Index built once for the case-insensitive fallback, so the lookup stays a
 * pure map read instead of a scan per call.
 */
const CASE_INSENSITIVE_COLORS = new Map(
  Object.entries(LANGUAGE_COLORS).map(([name, color]) => [name.toLowerCase(), color])
);

/**
 * Resolves a language name to its Linguist color: exact match first, then
 * case-insensitive (`typescript`), then the default. A repository with no
 * language at all yields the default as well, so callers can pass a nullable
 * name through unchanged.
 */
export function getLanguageColor(name: string | null | undefined): string {
  if (!name) return DEFAULT_LANGUAGE_COLOR;

  const exact = LANGUAGE_COLORS[name];
  if (exact) return exact;

  return CASE_INSENSITIVE_COLORS.get(name.toLowerCase()) ?? DEFAULT_LANGUAGE_COLOR;
}
