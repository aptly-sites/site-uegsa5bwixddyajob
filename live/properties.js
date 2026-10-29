// Progressive enhancement for the live-rendered /properties page: client-side filtering
// (same rules as components/SearchView.tsx) and the Leaflet map (same markers and popups as
// components/PropertyMap.tsx). The listing cards are already in the HTML, so without this
// script the page still shows every current home.
(function () {
  var form = document.querySelector('[data-filters]');
  var list = document.querySelector('[data-list]');
  var dataEl = document.getElementById('listings-data');
  if (!form || !list || !dataEl) return;

  var homes = [];
  try { homes = JSON.parse(dataEl.textContent || '[]'); } catch (e) { homes = []; }
  var cards = Array.prototype.slice.call(list.querySelectorAll('.listing-card'));
  var count = document.querySelector('[data-count]');
  var empty = document.querySelector('[data-empty]');
  var field = function (name) { return form.elements[name]; };

  function visibleIds() {
    var q = field('q').value.toLowerCase().trim();
    var beds = field('beds').value, baths = field('baths').value, rent = field('rent').value, type = field('type').value;
    var ids = {};
    cards.forEach(function (card) {
      var ok = (!q || card.getAttribute('data-search').indexOf(q) !== -1)
        && (!beds || Number(card.getAttribute('data-beds')) >= Number(beds))
        && (!baths || Number(card.getAttribute('data-baths')) >= Number(baths))
        && (!rent || Number(card.getAttribute('data-rent')) <= Number(rent))
        && (!type || card.getAttribute('data-type') === type);
      card.style.display = ok ? '' : 'none';
      if (ok) ids[card.getAttribute('href').split('/').pop()] = true;
    });
    return ids;
  }

  var map = null, layer = null;
  function drawMarkers(ids) {
    if (!map || !window.L) return;
    var L = window.L;
    if (layer) layer.remove();
    layer = L.layerGroup().addTo(map);
    var points = [];
    homes.forEach(function (item) {
      if (!ids[item.id] || item.latitude === null || item.longitude === null) return;
      var point = [item.latitude, item.longitude];
      points.push(point);
      var marker = L.marker(point, { icon: L.divIcon({ className: 'property-pin', html: '<span>$' + Math.round(item.rent).toLocaleString('en-US') + '</span>', iconSize: [88, 34], iconAnchor: [44, 34] }) });
      var popup = document.createElement('div');
      var name = document.createElement('strong'); name.textContent = item.address + ', ' + item.city;
      var price = document.createElement('p'); price.textContent = '$' + item.rent.toLocaleString('en-US') + '/mo · ' + item.beds + ' beds · ' + item.baths + ' baths';
      var link = document.createElement('a'); link.href = '/properties/' + item.id; link.textContent = 'View details';
      popup.appendChild(name); popup.appendChild(price); popup.appendChild(link);
      marker.bindPopup(popup);
      marker.addTo(layer);
    });
    if (points.length) map.fitBounds(points, { padding: [36, 36], maxZoom: 12 });
  }

  function update() {
    var ids = visibleIds();
    var n = Object.keys(ids).length;
    if (count) count.textContent = n + ' ' + (n === 1 ? 'home' : 'homes') + ' to explore';
    if (empty) empty.style.display = n === 0 ? '' : 'none';
    drawMarkers(ids);
  }

  form.addEventListener('submit', function (event) { event.preventDefault(); });
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  var clear = document.querySelector('[data-clear]');
  if (clear) clear.addEventListener('click', function () { form.reset(); update(); });

  function startMap() {
    var target = document.getElementById('property-map');
    if (!target || !window.L || map) return;
    map = window.L.map(target, { scrollWheelZoom: false, zoomControl: true }).setView([38.02, -122.59], 10);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    }).addTo(map);
    update();
    setTimeout(function () { map.invalidateSize(); }, 100);
  }

  update();
  if (window.L) startMap();
  else window.addEventListener('load', startMap);
})();
