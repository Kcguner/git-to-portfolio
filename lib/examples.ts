/**
 * `descriptionKey` is the locale-independent join between an example and its
 * localized blurb in `dictionary.home.exampleDescriptions`.
 *
 * The key is deliberately separate from `username`: usernames can be renamed
 * (or a profile replaced) without silently changing which translation renders,
 * and because the dictionary is typed as `Record<ExampleDescriptionKey, string>`
 * a missing translation is a compile-time error instead of a blank UI string.
 *
 * Order matters: the first entry is the site owner and leads the grid, and the
 * same list feeds the example links under the search box.
 */
export const EXAMPLES = [
  { username: 'kcguner', initials: 'KC', descriptionKey: 'kcguner' },
  { username: 'torvalds', initials: 'LT', descriptionKey: 'torvalds' },
] as const;

export type ExampleDescriptionKey = (typeof EXAMPLES)[number]['descriptionKey'];
