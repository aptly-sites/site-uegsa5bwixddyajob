// Ported from lib/listings.ts — same endpoint, same Basic auth, same field mapping and the
// same filtering (inactive / non-numeric ids dropped, implausible coordinates hidden). Only
// the runtime differs: credentials come from the Pages `env` instead of process.env, and
// Next's `fetch(..., { next: { revalidate: 60 } })` becomes a small per-isolate cache.
const ENDPOINT = 'https://prandiprop.rentvine.com/api/manager/properties/listings/search';
const PAGE_SIZE = 15;
const CACHE_MS = 60_000;
const FETCH_TIMEOUT_MS = 10_000;

const HOME_TYPES = {
  '1': 'Single-family home', '2': 'Apartment', '3': 'Condo',
  '4': 'Townhouse', '5': 'Duplex', '6': 'Multiplex',
  '7': 'Loft', '8': 'Mobile home',
};

const number = value => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

function safeImage(value) {
  if (typeof value !== 'string') return null;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && u.hostname === 'cdn.rentvine.com' ? u.toString() : null;
  } catch { return null; }
}

function cleanAddress(value) {
  return String(value ?? 'Address available on official listing')
    .replace(/,\s*[A-Za-z ]+,\s*CA\s*\d{5}(?:-\d{4})?$/, '')
    .replace(/,\s*$/, '');
}

function toListing(item) {
  const u = item?.unit, p = item?.property, l = item?.listing;
  if (!u || !p || !l || String(l.isActive) !== '1') return null;
  const id = String(l.propertyListingID ?? '');
  if (!/^\d+$/.test(id)) return null;
  const lat = number(u.latitude), lng = number(u.longitude);
  // The source currently puts a San Rafael unit near San Francisco. Hide implausible
  // points rather than misleading renters on the map.
  const plausible = lat >= 37.82 && lat <= 38.30 && lng >= -123 && lng <= -122.42;
  return {
    id, address: cleanAddress(u.address ?? p.address),
    city: String(u.city ?? p.city ?? 'Marin County'),
    state: String(u.stateID ?? 'CA'), zip: String(u.postalCode ?? ''),
    rent: number(u.rent), beds: number(u.beds), baths: number(u.baths),
    size: number(u.size) || null,
    type: HOME_TYPES[String(p.propertyTypeID)] ?? 'Home',
    headline: String(l.headline ?? 'Home for rent'),
    description: String(l.description ?? ''),
    latitude: plausible ? lat : null,
    longitude: plausible ? lng : null,
    image: safeImage(item?.image?.large ?? item?.image?.small),
    available: l.availabilityDate ? String(l.availabilityDate) : null,
    pets: String(l.acceptDogs) === '1' && String(l.acceptCats) === '1' ? 'Cats and dogs considered'
      : String(l.acceptDogs) === '1' ? 'Dogs considered'
      : String(l.acceptCats) === '1' ? 'Cats considered' : 'Check pet policy',
    officialUrl: `https://www.prandiprop.com/marin-county-homes-for-rent/${id}/details`,
  };
}

async function fetchPage(env, page) {
  const url = new URL(ENDPOINT);
  url.searchParams.set('isActive', '1');
  url.searchParams.set('page', String(page));
  url.searchParams.set('pageSize', String(PAGE_SIZE));
  url.searchParams.set('includes', 'property,unit,image');
  const response = await fetch(url, {
    headers: { Accept: 'application/json', Authorization: `Basic ${btoa(`${env.RENTVINE_API_USERNAME}:${env.RENTVINE_API_PASSWORD}`)}` },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Rentvine listings returned ${response.status}`);
  const results = await response.json();
  if (!Array.isArray(results)) throw new Error('Rentvine listings format changed');
  return { results, totalPages: Number(response.headers.get('pagination-total-pages') ?? '1') };
}

async function loadListings(env) {
  if (!env.RENTVINE_API_USERNAME || !env.RENTVINE_API_PASSWORD) throw new Error('Rentvine listings credentials are missing');
  const first = await fetchPage(env, 1);
  if (!Number.isInteger(first.totalPages) || first.totalPages < 1 || first.totalPages > 100) {
    throw new Error('Rentvine listings pagination is invalid');
  }
  const rest = await Promise.all(Array.from({ length: first.totalPages - 1 }, (_, i) => fetchPage(env, i + 2)));
  return [first, ...rest].flatMap(page => page.results).flatMap(item => toListing(item) ?? []);
}

// Per-isolate cache plus in-flight de-duplication: a burst of visitors costs one upstream
// fetch, and a failure is never cached (the next request retries).
let cached = null;
let inflight = null;

export function getListings(env) {
  if (cached && Date.now() - cached.at < CACHE_MS) return Promise.resolve(cached.listings);
  inflight ??= loadListings(env)
    .then(listings => { cached = { at: Date.now(), listings }; return listings; })
    .finally(() => { inflight = null; });
  return inflight;
}

export async function getListing(env, id) {
  return (await getListings(env)).find(item => item.id === id) ?? null;
}

// Test hook only.
export function resetListingsCache() { cached = null; inflight = null; }
