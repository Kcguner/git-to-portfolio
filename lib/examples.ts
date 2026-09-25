/**
 * `descriptionKey` is the locale-independent join between an example and its
 * localized blurb in `dictionary.home.exampleDescriptions`.
 *
 * The key is deliberately separate from `username`: usernames can be renamed
 * (or a profile replaced) without silently changing which translation renders,
 * and because the dictionary is typed as `Record<ExampleDescriptionKey, string>`
 * a missing translation is a compile-time error instead of a blank UI string.
 */
export const EXAMPLES = [
  { username: 'torvalds', initials: 'LT', descriptionKey: 'torvalds' },
  { username: 'gaearon', initials: 'GA', descriptionKey: 'gaearon' },
  { username: 'yyx990803', initials: 'EV', descriptionKey: 'yyx990803' },
] as const;

export type ExampleDescriptionKey = (typeof EXAMPLES)[number]['descriptionKey'];
