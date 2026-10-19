import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ThemeToggle from "../../components/ThemeToggle";
import { getDictionary, type Locale } from "../../lib/i18n";

/**
 * The toggle no longer knows about languages: its server parent resolves the
 * copy and hands it over, so the test does the same.
 */
function themeFor(locale: Locale) {
  return getDictionary(locale).theme;
}

function setThemeClass(theme: "light" | "dark") {
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(theme);
}

function readThemeCookie(): string | undefined {
  return document.cookie
    .split(";")
    .map((entry) => entry.trim().split("="))
    .find(([name]) => name === "theme")?.[1];
}

function clearCookies() {
  for (const entry of document.cookie.split(";")) {
    const name = entry.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=;path=/;max-age=0`;
  }
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    clearCookies();
    setThemeClass("light");
  });

  afterEach(() => {
    cleanup();
    clearCookies();
  });

  it("renders both states so the server class decides which is visible", () => {
    render(<ThemeToggle theme={themeFor("en")} />);

    // No effect and no client state: both labels are in the markup, and the
    // `dark:` variants pick the visible one from <html>.
    expect(screen.getByText("Switch to night theme")).toBeInTheDocument();
    expect(screen.getByText("Switch to paper theme")).toBeInTheDocument();

    const button = screen.getByRole("button");
    expect(button).toHaveClass("no-print");
    // The accessible name comes from the visible label, so the toggle announces
    // what pressing it will do rather than what it currently is.
    expect(button).toHaveAccessibleName();
  });

  it("switches to the night theme from paper and remembers it", () => {
    render(<ThemeToggle theme={themeFor("en")} />);

    fireEvent.click(screen.getByRole("button"));

    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement).not.toHaveClass("light");
    expect(readThemeCookie()).toBe("dark");
  });

  it("switches back to paper and remembers it", () => {
    setThemeClass("dark");
    render(<ThemeToggle theme={themeFor("tr")} />);

    fireEvent.click(screen.getByRole("button"));

    expect(document.documentElement).toHaveClass("light");
    expect(document.documentElement).not.toHaveClass("dark");
    expect(readThemeCookie()).toBe("light");
  });

  it("persists the choice for a year on every path", () => {
    const cookie = vi.spyOn(document, "cookie", "set");
    render(<ThemeToggle theme={themeFor("de")} />);

    fireEvent.click(screen.getByRole("button"));

    expect(cookie).toHaveBeenCalledWith(
      "theme=dark;path=/;max-age=31536000;SameSite=Lax",
    );
  });

  it("localizes the labels", () => {
    const { unmount } = render(<ThemeToggle theme={themeFor("es")} />);
    expect(screen.getByText("Cambiar al tema nocturno")).toBeInTheDocument();
    expect(screen.getByText("Cambiar al tema de papel")).toBeInTheDocument();
    unmount();

    render(<ThemeToggle theme={themeFor("de")} />);
    expect(screen.getByText("Zum Nachtmodus wechseln")).toBeInTheDocument();
    expect(screen.getByText("Zum Papiermodus wechseln")).toBeInTheDocument();
  });

  it("draws the palette each branch switches to, not the one on screen", () => {
    // A moon drawn on the night page reads as "switch to night", which is a
    // control with nothing left to do. The icon has to name the same target as
    // the label it sits next to, so each branch pairs them.
    const { unmount } = render(<ThemeToggle theme={themeFor("en")} />);

    const toNight = screen.getByText("Switch to night theme").parentElement;
    expect(toNight).toHaveClass("dark:hidden");
    // The moon: a single crescent, no disc and no rays.
    expect(toNight?.querySelectorAll("path")).toHaveLength(1);
    expect(toNight?.querySelectorAll("circle")).toHaveLength(0);

    const toPaper = screen.getByText("Switch to paper theme").parentElement;
    expect(toPaper).toHaveClass("hidden", "dark:block");
    // The sun: a disc inside a ring of rays.
    expect(toPaper?.querySelectorAll("path")).toHaveLength(1);
    expect(toPaper?.querySelectorAll("circle")).toHaveLength(1);
    unmount();
  });

  it("repaints the browser chrome with the palette it switches to", () => {
    // The `theme-color` meta tag is a literal now — the server cannot read the
    // cookie without making every document dynamic — so it keeps naming the
    // night palette until the toggle or the inline theme script repaints it.
    // Otherwise the tab and the address bar would show the wrong palette for
    // a year.
    setThemeClass("dark");
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = "#0a1628";
    document.head.append(meta);

    const { unmount } = render(<ThemeToggle theme={themeFor("en")} />);
    fireEvent.click(screen.getByRole("button"));
    expect(meta.content).toBe("#f4f6f9");

    fireEvent.click(screen.getByRole("button"));
    expect(meta.content).toBe("#0a1628");

    unmount();
    meta.remove();
  });
});
