import { serializeJsonLd } from "@/lib/seo";

type Props = {
  /** A JSON-LD node or `@graph` payload, usually built by `lib/seo.ts`. */
  data: unknown;
};

/**
 * Renders a JSON-LD data block.
 *
 * A data block is not executed, so it is not covered by the page's
 * `script-src` policy, and the payload is escaped by `serializeJsonLd()` so a
 * value containing `</script>` cannot break out of the tag.
 */
export default function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
