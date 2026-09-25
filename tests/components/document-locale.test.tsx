import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LOCALES, type Locale } from "../../lib/i18n";

const navigationMocks = vi.hoisted(() => ({
  searchParams: vi.fn(() => new URLSearchParams()),
  setSearchParams: (search: string) => {
    navigationMocks.searchParams.mockReturnValue(new URLSearchParams(search));
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/current",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: navigationMocks.searchParams,
}));

import DocumentLocale, {
  LocalizedNotFound,
  NotFoundView,
} from "../../components/DocumentLocale";

const EXPECTED_NOT_FOUND = {
  tr: {
    pageLabel: "Sayfa bulunamadı",
    pageTitle: "Aradığın sayfa yok",
    pageDescription:
      "Aradığın sayfa taşınmış veya hiç var olmamış olabilir. Ana sayfaya dönerek yeniden deneyebilirsin.",
    userLabel: "Profil bulunamadı",
    userTitle: "Kullanıcı bulunamadı",
    userDescription:
      "Aradığın GitHub kullanıcısı bulunamadı. Kullanıcı adını kontrol edip tekrar dene.",
    backHome: "Ana sayfaya dön",
    href: "/",
  },
  en: {
    pageLabel: "Page not found",
    pageTitle: "The page you requested does not exist",
    pageDescription:
      "The page may have moved or never existed. Return home and try again.",
    userLabel: "Profile not found",
    userTitle: "User not found",
    userDescription:
      "The GitHub user you requested could not be found. Check the username and try again.",
    backHome: "Back to home",
    href: "/?lang=en",
  },
  de: {
    pageLabel: "Seite nicht gefunden",
    pageTitle: "Die gewünschte Seite gibt es nicht",
    pageDescription:
      "Die Seite wurde möglicherweise verschoben oder hat nie existiert. Kehre zur Startseite zurück und versuche es erneut.",
    userLabel: "Profil nicht gefunden",
    userTitle: "Benutzer nicht gefunden",
    userDescription:
      "Der gesuchte GitHub-Benutzer wurde nicht gefunden. Prüfe den Benutzernamen und versuche es erneut.",
    backHome: "Zurück zur Startseite",
    href: "/?lang=de",
  },
  es: {
    pageLabel: "Página no encontrada",
    pageTitle: "La página que buscas no existe",
    pageDescription:
      "Puede que la página se haya movido o nunca haya existido. Vuelve al inicio e inténtalo de nuevo.",
    userLabel: "Perfil no encontrado",
    userTitle: "Usuario no encontrado",
    userDescription:
      "No se encontró el usuario de GitHub solicitado. Comprueba el nombre e inténtalo de nuevo.",
    backHome: "Volver al inicio",
    href: "/?lang=es",
  },
} as const satisfies Record<Locale, Record<string, string>>;

describe("DocumentLocale", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("lang");
    navigationMocks.searchParams.mockReset().mockReturnValue(new URLSearchParams());
  });

  afterEach(cleanup);

  it("renders nothing", () => {
    const { container } = render(<DocumentLocale />);

    expect(container).toBeEmptyDOMElement();
  });

  it("applies the default locale to the document element", () => {
    render(<DocumentLocale />);

    expect(document.documentElement.lang).toBe("tr");
  });

  it("applies every supported locale from the lang query value", () => {
    for (const locale of LOCALES) {
      navigationMocks.setSearchParams(`lang=${locale}`);
      const { unmount } = render(<DocumentLocale />);

      expect(document.documentElement.lang).toBe(locale);
      unmount();
    }
  });

  it("re-applies the locale when a client navigation changes it", () => {
    navigationMocks.setSearchParams("lang=en");
    const { rerender } = render(<DocumentLocale />);
    expect(document.documentElement.lang).toBe("en");

    navigationMocks.setSearchParams("lang=de");
    rerender(<DocumentLocale />);
    expect(document.documentElement.lang).toBe("de");
  });

  it("falls back to the default for a missing or unusable lang value", () => {
    navigationMocks.setSearchParams("");
    const { rerender } = render(<DocumentLocale />);
    expect(document.documentElement.lang).toBe("tr");

    navigationMocks.setSearchParams("lang=fr");
    rerender(<DocumentLocale />);
    expect(document.documentElement.lang).toBe("tr");

    navigationMocks.setSearchParams("lang=en&lang=de");
    rerender(<DocumentLocale />);
    expect(document.documentElement.lang).toBe("tr");
  });
});

describe("NotFoundView", () => {
  afterEach(cleanup);

  it("renders a localized page 404 for every supported locale", () => {
    for (const locale of LOCALES) {
      const expected = EXPECTED_NOT_FOUND[locale];
      const { unmount } = render(<NotFoundView locale={locale} kind="page" />);

      expect(screen.getByText(expected.pageLabel)).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: expected.pageTitle })
      ).toBeInTheDocument();
      expect(screen.getByText(expected.pageDescription)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: expected.backHome })).toHaveAttribute(
        "href",
        expected.href
      );

      unmount();
    }
  });

  it("renders a localized user 404 for every supported locale", () => {
    for (const locale of LOCALES) {
      const expected = EXPECTED_NOT_FOUND[locale];
      const { unmount } = render(<NotFoundView locale={locale} kind="user" />);

      expect(screen.getByText(expected.userLabel)).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: expected.userTitle })
      ).toBeInTheDocument();
      expect(screen.getByText(expected.userDescription)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: expected.backHome })).toHaveAttribute(
        "href",
        expected.href
      );

      unmount();
    }
  });
});

describe("LocalizedNotFound", () => {
  beforeEach(() => {
    navigationMocks.searchParams.mockReset().mockReturnValue(new URLSearchParams());
  });

  afterEach(cleanup);

  it("picks the locale from the lang query value", () => {
    navigationMocks.setSearchParams("lang=de");

    render(<LocalizedNotFound kind="user" />);

    expect(
      screen.getByRole("heading", { name: EXPECTED_NOT_FOUND.de.userTitle })
    ).toBeInTheDocument();
  });

  it("falls back to the default locale without a lang query value", () => {
    render(<LocalizedNotFound kind="page" />);

    expect(
      screen.getByRole("heading", { name: EXPECTED_NOT_FOUND.tr.pageTitle })
    ).toBeInTheDocument();
  });

  it("leaves document.title alone so the server-rendered title stays authoritative", () => {
    const serverTitle = "The page you requested does not exist | Git-to-Portfolio";
    document.title = serverTitle;
    navigationMocks.setSearchParams("lang=en");

    render(<LocalizedNotFound kind="page" />);

    expect(document.title).toBe(serverTitle);
  });
});
