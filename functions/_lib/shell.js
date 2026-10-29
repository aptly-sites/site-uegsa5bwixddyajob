// The page chrome (header, footer, stylesheet) comes from _shell/index.html, which
// tools/build-export.mjs crawls from the real app and prepares with three markers:
//   <!--aptly:title-->  <!--aptly:description-->  (in <head>)   and   <!--aptly:main-->
// The shell is named index.html on purpose: Cloudflare Pages redirects a bare *.html
// request to its extensionless URL, and env.ASSETS.fetch() follows that redirect, so any
// other name would return a 308 instead of the file.
import { esc } from './esc.js';

const SHELL_PATH = '/_shell/index.html';

export async function fetchShell(env, base) {
  const res = await env.ASSETS.fetch(new URL(SHELL_PATH, base));
  if (!res.ok) return null;
  const html = await res.text();
  return html.includes('<!--aptly:main-->') ? html : null;
}

export function fillShell(shell, { title, description, main }) {
  // Function replacers: a '$&' or '$1' inside listing text must stay literal.
  return shell
    .replace('<!--aptly:title-->', () => `<title>${esc(title)}</title>`)
    .replace('<!--aptly:description-->', () => `<meta name="description" content="${esc(description)}"/>`)
    .replace('<!--aptly:main-->', () => main);
}
