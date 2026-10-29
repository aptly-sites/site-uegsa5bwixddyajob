// Live-renders /properties and /properties/<id> on every request from PRANDI's Rentvine
// feed, so rent, availability, photos and new or removed listings are always current with
// no rebuild or re-crawl. Everything else on the site is a static snapshot (see README.md).
//
// Scoped to /properties/* by its directory. Any other path under it falls through to
// static serving (and then 404.html) via next().
//
// Requires the Pages environment variables RENTVINE_API_USERNAME and RENTVINE_API_PASSWORD.
import { getListing, getListings } from '../_lib/rentvine.js';
import { fetchShell, fillShell } from '../_lib/shell.js';
import {
  DEFAULT_TITLE, PROPERTIES_META, detailMeta,
  renderDetail, renderMissing, renderProperties, renderUnavailable,
} from '../_lib/render.js';

const LIST_PATH = /^\/properties\/?$/;
const DETAIL_PATH = /^\/properties\/(\d+)\/?$/;

export async function onRequest({ request, next, env }) {
  const url = new URL(request.url);
  const isList = LIST_PATH.test(url.pathname);
  const detail = DETAIL_PATH.exec(url.pathname);
  if ((!isList && !detail) || !['GET', 'HEAD'].includes(request.method)) return next();

  const shell = await fetchShell(env, url);
  if (!shell) return next(); // no shell deployed: fall back to static serving rather than fail

  const respond = (page, status = 200, extra = {}) => new Response(request.method === 'HEAD' ? null : page, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', ...extra },
  });

  if (isList) {
    let listings = [];
    let failed = false;
    try { listings = await getListings(env); } catch (error) { failed = true; console.error('properties: listings unavailable', error?.message); }
    const page = fillShell(shell, { ...PROPERTIES_META, main: renderProperties(listings, failed) });
    return respond(page, failed ? 503 : 200, failed ? { 'Retry-After': '60' } : {});
  }

  const id = detail[1];
  let item;
  try { item = await getListing(env, id); } catch (error) {
    console.error('properties: listing unavailable', error?.message);
    const page = fillShell(shell, { ...detailMeta(id), main: renderUnavailable() });
    return respond(page, 503, { 'Retry-After': '60' });
  }
  if (!item) {
    const page = fillShell(shell, { title: DEFAULT_TITLE, description: PROPERTIES_META.description, main: renderMissing() });
    return respond(page, 404);
  }
  return respond(fillShell(shell, { ...detailMeta(id), main: renderDetail(item) }));
}
