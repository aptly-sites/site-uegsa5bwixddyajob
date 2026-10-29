// Plain-HTML equivalents of app/properties/page.tsx, app/properties/[id]/page.tsx,
// components/SearchView.tsx and app/properties/[id]/not-found.tsx. They emit the same
// markup and CSS classes (so the site's existing stylesheet styles them identically) but as
// finished HTML: nothing here needs client-side JS to show its content. Filtering and the
// map are progressive enhancement in /live/properties.js.
import { esc, jsonForScript } from './esc.js';

export const OFFICIAL_LISTINGS = 'https://www.prandiprop.com/marin-county-homes-for-rent';
export const DEFAULT_TITLE = 'PRANDI | Marin County Property Management';

const ICON_ATTRS = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
const ICON_PIN = `<svg ${ICON_ATTRS} width="15" height="15" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
const ICON_ARROW = `<svg ${ICON_ATTRS} width="16" height="16" class="lucide lucide-arrow-up-right"><path d="M7 7h10v10"></path><path d="M7 17 17 7"></path></svg>`;
const ICON_HOME = `<svg ${ICON_ATTRS} width="40" height="40" class="lucide lucide-house lucide-home"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>`;

const money = n => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
const plural = (n, one, many) => (n === 1 ? one : many);

function availability(item) {
  const date = item.available ? new Date(item.available) : null;
  return date && !Number.isNaN(date.getTime()) && date.getTime() > Date.now()
    ? `Available ${new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date)}`
    : 'Check current availability';
}

function renderCard(item) {
  const search = `${item.address} ${item.city} ${item.zip}`.toLowerCase();
  const media = item.image
    ? `<img src="${esc(item.image)}" alt="Exterior of ${esc(item.address)}" loading="lazy"/>`
    : `<div class="listing-placeholder">${ICON_HOME}</div>`;
  return `<a class="listing-card" href="/properties/${esc(item.id)}" data-beds="${item.beds}" data-baths="${item.baths}" data-rent="${item.rent}" data-type="${esc(item.type)}" data-search="${esc(search)}">`
    + `<div class="listing-card-media">${media}</div>`
    + `<div class="listing-card-body"><div class="listing-card-heading"><span>${esc(item.city)} · ${esc(item.type)}</span><strong>$${money(item.rent)}<small> / mo</small></strong></div>`
    + `<h3>${esc(item.address)}</h3><p>${esc(item.city)}, ${esc(item.state)} ${esc(item.zip)}</p>`
    + `<div class="listing-card-footer"><span>${item.beds} ${plural(item.beds, 'bed', 'beds')}</span><span>${item.baths} ${plural(item.baths, 'bath', 'baths')}</span>`
    + `${item.size ? `<span>${money(item.size)} sq ft</span>` : ''}<span class="listing-card-link">View home ${ICON_ARROW}</span></div></div></a>`;
}

const INTRO = `<div class="listing-intro"><p class="eyebrow">AVAILABLE HOMES</p><h1>Find your place in Marin.</h1><p>Explore rentals managed by PRANDI. Open any home to review its details, then use the official listing to apply or arrange a showing.</p></div>`;

export const PROPERTIES_META = {
  title: 'Marin homes for rent | PRANDI',
  description: 'Explore PRANDI rental homes in Marin County with list and map views.',
};

export function renderProperties(listings, error) {
  if (error) {
    return `<main id="main" class="container">${INTRO}`
      + `<div class="feed-note"><span>Live inventory is temporarily unavailable here. Use PRANDI’s official listings page for current availability.</span><a href="${OFFICIAL_LISTINGS}" target="_blank" rel="noopener noreferrer">Official listings ↗</a></div>`
      + `<div class="empty-state"><h2>Continue to PRANDI’s current rental search</h2><p>The official listings page has current prices, photos, applications, and tours.</p><a class="button" href="${OFFICIAL_LISTINGS}" target="_blank" rel="noopener noreferrer">Open current listings</a></div></main>`;
  }
  const sorted = [...listings].sort((a, b) => b.rent - a.rent);
  const types = [...new Set(sorted.map(item => item.type))].sort();
  const mapData = sorted.map(({ id, address, city, rent, beds, baths, latitude, longitude }) => ({ id, address, city, rent, beds, baths, latitude, longitude }));
  return `<main id="main" class="container">${INTRO}`
    + `<div class="feed-note"><span>Live homes from PRANDI’s Rentvine feed. Confirm availability and terms on the official listing.</span><a href="${OFFICIAL_LISTINGS}" target="_blank" rel="noopener noreferrer">Official listings ↗</a></div>`
    + `<form class="search-panel" role="search" aria-label="Filter rental homes" data-filters>`
    + `<label>Location<input type="search" name="q" placeholder="Address, city, or ZIP" value=""/></label>`
    + `<label>Bedrooms<select name="beds"><option value="" selected="">Any</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option></select></label>`
    + `<label>Bathrooms<select name="baths"><option value="" selected="">Any</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option></select></label>`
    + `<label>Max rent<select name="rent"><option value="" selected="">Any</option><option value="3000">$3,000</option><option value="4000">$4,000</option><option value="5000">$5,000</option><option value="6500">$6,500</option><option value="8000">$8,000</option></select></label>`
    + `<label>Home type<select name="type"><option value="" selected="">Any</option>${types.map(t => `<option>${esc(t)}</option>`).join('')}</select></label></form>`
    + `<div class="map-layout"><div class="map-panel"><div class="property-map" id="property-map" role="region" aria-label="Map of available rental homes"></div>`
    + `<div class="map-caption">${ICON_PIN} Explore homes across Marin County</div></div>`
    + `<section class="listing-results" aria-labelledby="listing-results-heading" tabindex="0"><div class="list-toolbar"><div><p class="eyebrow">CURRENT AVAILABILITY</p>`
    + `<h2 id="listing-results-heading" data-count>${sorted.length} ${plural(sorted.length, 'home', 'homes')} to explore</h2></div><span>Sorted by monthly rent</span></div>`
    + `<div class="empty-state" data-empty${sorted.length ? ' style="display:none"' : ''}><h3>No homes match these filters</h3><p>Try a wider rent range or fewer bedrooms.</p><button class="button" type="button" data-clear>Clear filters</button></div>`
    + `<div class="listing-list" data-list>${sorted.map(renderCard).join('')}</div></section></div>`
    + `<script type="application/json" id="listings-data">${jsonForScript(mapData)}</script>`
    + `<script src="/live/leaflet.js" defer></script><script src="/live/properties.js" defer></script></main>`;
}

export function detailMeta(id) {
  return { title: `Rental home ${id} | PRANDI`, description: 'View rental home details and continue to the official PRANDI listing.' };
}

export function renderDetail(item) {
  const price = money(item.rent);
  const photo = item.image
    ? `<img class="detail-photo" src="${esc(item.image)}" alt="Exterior of ${esc(item.address)}"/>`
    : `<div class="detail-photo detail-photo-empty">Property photo available on the official listing</div>`;
  return `<main id="main" class="listing-detail"><div class="container">`
    + `<div class="detail-topline"><a class="back-link" href="/properties">← Back to available homes</a><span>PRANDI · MARIN COUNTY RENTALS</span></div>`
    + `<div class="detail-heading"><div><p class="eyebrow">AVAILABLE HOME</p><h1>${esc(item.address)}</h1><p class="detail-meta">${esc(item.city)}, ${esc(item.state)} ${esc(item.zip)} · ${esc(item.type)}</p></div>`
    + `<div class="detail-heading-price"><strong>$${price}</strong><span>per month</span></div></div>`
    + `<div class="detail-main"><div class="detail-story">${photo}`
    + `<div class="detail-facts"><span><strong>${item.beds}</strong> ${plural(item.beds, 'bedroom', 'bedrooms')}</span><span><strong>${item.baths}</strong> ${plural(item.baths, 'bathroom', 'bathrooms')}</span>${item.size ? `<span><strong>${item.size.toLocaleString('en-US')}</strong> sq ft</span>` : ''}</div>`
    + `<section class="detail-description"><p class="eyebrow">THE HOME</p><h2>About this property</h2><p class="detail-copy">${esc(item.description || item.headline)}</p></section></div>`
    + `<aside class="detail-side"><p class="eyebrow">HOME AT A GLANCE</p><strong class="detail-side-price">$${price}<small> / month</small></strong>`
    + `<p class="detail-side-address">${esc(item.address)}<br/>${esc(item.city)}, ${esc(item.state)} ${esc(item.zip)}</p><div class="detail-side-rule"></div>`
    + `<dl><div><dt>Availability</dt><dd>${esc(availability(item))}</dd></div><div><dt>Home type</dt><dd>${esc(item.type)}</dd></div><div><dt>Pet policy</dt><dd>${esc(item.pets)}</dd></div></dl>`
    + `<a class="button" href="${esc(item.officialUrl)}" target="_blank" rel="noopener noreferrer">Apply or schedule on official listing ↗</a>`
    + `<p class="fine-print">Confirm availability, fees, pet terms, and other details on PRANDI’s official listing before applying.</p></aside></div></div></main>`;
}

export function renderMissing() {
  return `<main id="main" class="container page-section"><h1>That home may no longer be available.</h1><p>Listings change often. Check current homes and application details with PRANDI.</p><a class="button" href="/properties">Back to homes</a> <a class="button" href="${OFFICIAL_LISTINGS}" target="_blank" rel="noopener noreferrer">Official listings</a></main>`;
}

export function renderUnavailable() {
  return `<main id="main" class="container page-section"><h1>Home details are temporarily unavailable.</h1><p>We couldn’t reach PRANDI’s live listings just now. Please try again in a minute, or use the official listings page.</p><a class="button" href="/properties">Back to homes</a> <a class="button" href="${OFFICIAL_LISTINGS}" target="_blank" rel="noopener noreferrer">Official listings</a></main>`;
}
