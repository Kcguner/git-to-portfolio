import { THEME_COOKIE, THEME_COLORS } from '@/lib/theme';

/**
 * The theme, applied before the first paint.
 *
 * The root layout is a static, prerendered document: it cannot read a cookie
 * on the server, because reading one would make every page dynamic and there
 * would be nothing left to cache. So the server always renders the default
 * (night) palette, and this script corrects the class on `<html>` in the
 * browser before the first paint — the only moment a flash of the wrong
 * palette is possible.
 *
 * It is a **plain string constant**: no request-time value is interpolated
 * into it, so the page stays statically renderable and the script is
 * byte-identical on every page. Everything it needs (the cookie name and the
 * two chrome colours) comes from `lib/theme.ts`, so the toggle, the cookie and
 * this script cannot drift apart.
 *
 * The same script is used by the global 404 page, which is rendered outside
 * the root layout and therefore has to carry its own copy.
 */
export const THEME_SCRIPT = `(function(){try{var n=${JSON.stringify(
  THEME_COOKIE,
)},p=document.cookie?document.cookie.split(";"):[],v="",i,c,t;for(i=0;i<p.length;i++){c=p[i].trim();if(c.indexOf(n+"=")===0){v=decodeURIComponent(c.slice(n.length+1));break;}}t=v==="light"?"light":"dark";var d=document.documentElement;d.classList.remove("light","dark");d.classList.add(t);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="light"?${JSON.stringify(
  THEME_COLORS.light,
)}:${JSON.stringify(THEME_COLORS.dark)});}catch(e){}})();`;
