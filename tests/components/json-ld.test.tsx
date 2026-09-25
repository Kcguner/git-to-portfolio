import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import JsonLd from "../../components/JsonLd";

afterEach(cleanup);

/** Reads the payload of the rendered data block back as JSON. */
function readPayload(container: HTMLElement): unknown {
  const block = container.querySelector('script[type="application/ld+json"]');
  return JSON.parse((block?.textContent ?? "").replace(/\\u003c/g, "<"));
}

describe("JsonLd", () => {
  it("renders the payload as a JSON-LD data block", () => {
    const data = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: "The Octocat",
    };
    const { container } = render(<JsonLd data={data} />);
    const block = container.querySelector("script");

    expect(block?.getAttribute("type")).toBe("application/ld+json");
    expect(readPayload(container)).toEqual(data);
  });

  it("escapes markup so a value cannot close the data block", () => {
    // Repository descriptions and bios are attacker-controlled text, and a raw
    // `</script>` inside one would end the block early.
    const { container } = render(
      <JsonLd data={{ description: "</script><img src=x onerror=alert(1)>" }} />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")?.innerHTML).not.toContain("</script>");
    expect(readPayload(container)).toEqual({
      description: "</script><img src=x onerror=alert(1)>",
    });
  });
});
