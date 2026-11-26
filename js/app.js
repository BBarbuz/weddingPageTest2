/* ------------------------------------------------------------------
   Atelier Gracja — logika strony (bez backendu).
   Koszyk i ulubione zapisywane są tylko w przeglądarce (localStorage).
------------------------------------------------------------------- */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + '\u00a0zł';
  const byId = (id) => PRODUCTS.find((p) => p.id === id);

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* tryb prywatny itp. */ } },
  };

  const FREE_SHIPPING = 2000;
  const SHIPPING = 49;
  const SIZES = ['32', '34', '36', '38', '40', '42', '44', '46', '48', 'Na wymiar'];
  const PRICE_RANGES = [
    { key: 'p1', label: 'do 1 000 zł',        test: (v) => v < 1000 },
    { key: 'p2', label: '1 000 – 3 500 zł',   test: (v) => v >= 1000 && v < 3500 },
    { key: 'p3', label: '3 500 – 5 500 zł',   test: (v) => v >= 3500 && v < 5500 },
    { key: 'p4', label: 'powyżej 5 500 zł',   test: (v) => v >= 5500 },
  ];
  const VIEWS = {
    full:   { label: 'Całość', box: '0 0 300 420' },
    top:    { label: 'Gorset', box: '70 22 160 200' },
    bottom: { label: 'Dół',    box: '0 220 300 210' },
  };
  const GROUPS = [
    { key: 'silhouette', title: 'Sylwetka', options: SILHOUETTES },
    { key: 'neckline',   title: 'Dekolt',   options: NECKLINES },
    { key: 'color',      title: 'Kolor',    options: Object.fromEntries(Object.entries(COLORS).map(([k, c]) => [k, c.name])) },
    { key: 'price',      title: 'Cena',     options: Object.fromEntries(PRICE_RANGES.map((r) => [r.key, r.label])) },
  ];

  const state = {
    category: 'all',
    q: '',
    sort: 'featured',
    favOnly: false,
    f: { silhouette: new Set(), neckline: new Set(), color: new Set(), price: new Set() },
    cardColor: {},
    fav: new Set(store.get('gracja.fav', [])),
    cart: store.get('gracja.cart', []),
    modal: null,
  };

  /* ---------- helpers ---------- */
  const isLightBg = (p) => p.category === 'wedding';

  function media(p, color, view = 'full') {
    if (p.photos && p.photos.length) {
      const i = { full: 0, top: 1, bottom: 2 }[view] || 0;
      return `<img src="${p.photos[i] || p.photos[0]}" alt="Suknia ${p.name}" loading="lazy">`;
    }
    return DressArt.render(p, COLORS[color].hex, { viewBox: VIEWS[view].box });
  }

  const priceHTML = (p) =>
    `<span class="price-now${p.oldPrice ? ' is-sale' : ''}">${fmt(p.price)}</span>` +
    (p.oldPrice ? `<s class="price-old">${fmt(p.oldPrice)}</s>` : '');

  const stars = (r) => {
    const full = Math.round(r);
    return `<span class="stars" aria-label="Ocena ${r} na 5">${'★'.repeat(full)}${'☆'.repeat(5 - full)}</span>`;
  };

  const badgeOf = (p) => {
    if (p.oldPrice) return `-${Math.round((1 - p.price / p.oldPrice) * 100)}%`;
    return p.badge || '';
  };

  const swatchesHTML = (p, active, size = '') =>
    `<div class="swatches ${size}" role="radiogroup" aria-label="Kolor">${p.colors
      .map((c) => `<button class="swatch${c === active ? ' is-active' : ''}" data-swatch="${c}" data-id="${p.id}"
         style="--c:${COLORS[c].hex}" title="${COLORS[c].name}" aria-label="${COLORS[c].name}" role="radio" aria-checked="${c === active}"></button>`)
      .join('')}</div>`;

  let toastTimer;
  function toast(html) {
    const t = $('#toast');
    t.innerHTML = html;
    t.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-show'), 3200);
  }

  /* ---------- filtrowanie ---------- */
  function matches(p, skip) {
    if (state.category !== 'all' && p.category !== state.category) return false;
    if (state.favOnly && !state.fav.has(p.id)) return false;
    if (state.q) {
      const hay = [p.name, p.fabric, CATEGORIES[p.category], SILHOUETTES[p.silhouette], NECKLINES[p.neckline],
        ...p.colors.map((c) => COLORS[c].name)].join(' ').toLowerCase();
      if (!hay.includes(state.q)) return false;
    }
    const f = state.f;
    if (skip !== 'silhouette' && f.silhouette.size && !f.silhouette.has(p.silhouette)) return false;
    if (skip !== 'neckline' && f.neckline.size && !f.neckline.has(p.neckline)) return false;
    if (skip !== 'color' && f.color.size && !p.colors.some((c) => f.color.has(c))) return false;
    if (skip !== 'price' && f.price.size && !PRICE_RANGES.some((r) => f.price.has(r.key) && r.test(p.price))) return false;
    return true;
  }

  const optionTest = (group, key) => (p) => {
    if (group === 'color') return p.colors.includes(key);
    if (group === 'price') return PRICE_RANGES.find((r) => r.key === key).test(p.price);
    return p[group] === key;
  };

  function sorted(list) {
    const s = [...list];
    switch (state.sort) {
      case 'new': return s.sort((a, b) => b.added - a.added);
      case 'price-asc': return s.sort((a, b) => a.price - b.price);
      case 'price-desc': return s.sort((a, b) => b.price - a.price);
      case 'rating': return s.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
      default: return s;
    }
  }

  function cardColorFor(p) {
    if (state.cardColor[p.id]) return state.cardColor[p.id];
    if (state.f.color.size) {
      const hit = p.colors.find((c) => state.f.color.has(c));
      if (hit) return hit;
    }
    return p.colors[0];
  }

  /* ---------- render: filtry ---------- */
  function renderFilters() {
    $('#filterGroups').innerHTML = GROUPS.map((g) => {
      const pool = PRODUCTS.filter((p) => matches(p, g.key));
      const opts = Object.entries(g.options)
        .map(([key, label]) => ({ key, label, n: pool.filter(optionTest(g.key, key)).length }))
        .filter((o) => o.n > 0 || state.f[g.key].has(o.key));
      if (!opts.length) return '';
      return `<fieldset class="fgroup">
        <legend>${g.title}</legend>
        ${opts.map((o) => `<label class="fopt${g.key === 'color' ? ' is-color' : ''}">
            <input type="checkbox" data-group="${g.key}" value="${o.key}" ${state.f[g.key].has(o.key) ? 'checked' : ''}>
            ${g.key === 'color' ? `<span class="fswatch" style="--c:${COLORS[o.key].hex}"></span>` : '<span class="fbox"></span>'}
            <span class="flabel">${o.label}</span><span class="fcount">${o.n}</span>
          </label>`).join('')}
      </fieldset>`;
    }).join('');

    const chips = [];
    if (state.favOnly) chips.push(`<button class="chip" data-chip="fav">Tylko ulubione ×</button>`);
    if (state.q) chips.push(`<button class="chip" data-chip="q">„${state.q}” ×</button>`);
    GROUPS.forEach((g) => state.f[g.key].forEach((k) =>
      chips.push(`<button class="chip" data-chip="${g.key}" data-key="${k}">${g.options[k]} ×</button>`)));
    if (chips.length) chips.push(`<button class="chip chip-clear" data-chip="all">Wyczyść wszystko</button>`);
    $('#activeFilters').innerHTML = chips.join('');

    const n = Object.values(state.f).reduce((a, s) => a + s.size, 0);
    $('#filterBadge').textContent = n ? `(${n})` : '';
  }

  /* ---------- render: siatka ---------- */
  function renderGrid() {
    const list = sorted(PRODUCTS.filter((p) => matches(p)));
    $('#resultCount').textContent = `${list.length} ${list.length === 1 ? 'suknia' : list.length % 10 >= 2 && list.length % 10 <= 4 && (list.length % 100 < 10 || list.length % 100 >= 20) ? 'suknie' : 'sukien'}`;

    const title = state.favOnly ? 'Twoje ulubione' : state.category === 'all' ? 'Wszystkie suknie' : CATEGORIES[state.category];
    $('#shopTitle').textContent = title;

    if (!list.length) {
      $('#grid').innerHTML = `<div class="empty">
        <p class="empty-title">${state.favOnly && !state.fav.size ? 'Nie masz jeszcze ulubionych sukien' : 'Brak sukien dla wybranych filtrów'}</p>
        <p>${state.favOnly && !state.fav.size ? 'Kliknij serduszko przy sukni, aby ją tu zapisać.' : 'Spróbuj zmienić lub wyczyścić filtry.'}</p>
        <button class="btn btn-ghost" data-chip="all">Pokaż wszystkie suknie</button>
      </div>`;
      return;
    }

    $('#grid').innerHTML = list.map((p, i) => {
      const color = cardColorFor(p);
      const badge = badgeOf(p);
      const fav = state.fav.has(p.id);
      return `<article class="card" style="--i:${i}">
        <div class="card-media ${isLightBg(p) ? 'bg-bridal' : 'bg-color'}" data-open="${p.id}" tabindex="0" role="button" aria-label="Zobacz suknię ${p.name}">
          <div class="card-img card-img-main">${media(p, color, 'full')}</div>
          <div class="card-img card-img-alt">${media(p, color, 'top')}</div>
          ${badge ? `<span class="badge${p.oldPrice ? ' badge-sale' : ''}">${badge}</span>` : ''}
          <button class="fav${fav ? ' is-fav' : ''}" data-fav="${p.id}" aria-label="${fav ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}" aria-pressed="${fav}">
            <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>
          </button>
          <span class="quick">Szybki podgląd</span>
        </div>
        <div class="card-body">
          ${swatchesHTML(p, color)}
          <h3 class="card-title"><button data-open="${p.id}">${p.name}</button></h3>
          <p class="card-meta">${SILHOUETTES[p.silhouette]} · ${NECKLINES[p.neckline]}</p>
          <p class="price">${priceHTML(p)}</p>
        </div>
      </article>`;
    }).join('');
  }

  function renderAll() {
    renderFilters();
    renderGrid();
    $$('.nav a[data-cat]').forEach((a) => a.classList.toggle('is-active', !state.favOnly && a.dataset.cat === state.category));
  }

  /* ---------- ulubione ---------- */
  function toggleFav(id) {
    if (state.fav.has(id)) state.fav.delete(id);
    else {
      state.fav.add(id);
      toast(`♡ <strong>${byId(id).name}</strong> dodana do ulubionych`);
    }
    store.set('gracja.fav', [...state.fav]);
    updateCounts();
  }

  /* ---------- koszyk ---------- */
  const cartQty = () => state.cart.reduce((a, i) => a + i.qty, 0);
  const cartSubtotal = () => state.cart.reduce((a, i) => a + byId(i.id).price * i.qty, 0);
  const saveCart = () => store.set('gracja.cart', state.cart);

  function updateCounts() {
    const fc = $('#favCount'), cc = $('#cartCount');
    fc.hidden = !state.fav.size; fc.textContent = state.fav.size;
    const q = cartQty();
    cc.hidden = !q; cc.textContent = q;
    $('#favBtn').classList.toggle('is-active', state.favOnly);
  }

  function addToCart(id, color, size) {
    const key = `${id}|${color}|${size}`;
    const hit = state.cart.find((i) => i.key === key);
    if (hit) hit.qty += 1;
    else state.cart.push({ key, id, color, size, qty: 1 });
    saveCart();
    updateCounts();
    renderCart();
  }

  function renderCart() {
    // usuń pozycje, których produkt już nie istnieje (np. po edycji products.js)
    state.cart = state.cart.filter((i) => byId(i.id) && COLORS[i.color]);
    const q = cartQty();
    $('#cartTitleCount').textContent = q ? `(${q})` : '';

    if (!state.cart.length) {
      $('#cartBody').innerHTML = `<div class="cart-empty">
        <svg viewBox="0 0 24 24"><path d="M5 8h14l-1.2 12H6.2L5 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>
        <p class="empty-title">Twój koszyk jest pusty</p>
        <p>Wybierz suknię, kolor i rozmiar — dodamy ją tutaj.</p>
        <button class="btn" data-close data-goto="wedding">Przeglądaj suknie</button>
      </div>`;
      $('#cartFoot').innerHTML = '';
      return;
    }

    const sub = cartSubtotal();
    const missing = Math.max(0, FREE_SHIPPING - sub);
    const ship = missing ? SHIPPING : 0;
    const pct = Math.min(100, (sub / FREE_SHIPPING) * 100);

    $('#cartBody').innerHTML = `
      <div class="ship-bar">
        <p>${missing ? `Do darmowej dostawy brakuje <strong>${fmt(missing)}</strong>` : '✓ Masz <strong>darmową dostawę</strong>'}</p>
        <div class="ship-track"><span style="width:${pct}%"></span></div>
      </div>
      <ul class="cart-list">
        ${state.cart.map((i) => {
          const p = byId(i.id);
          return `<li class="cart-item">
            <button class="cart-thumb ${isLightBg(p) ? 'bg-bridal' : 'bg-color'}" data-open="${p.id}" data-color="${i.color}" aria-label="Zobacz ${p.name}">${media(p, i.color, 'top')}</button>
            <div class="cart-info">
              <div class="cart-row"><strong class="cart-name">${p.name}</strong><span>${fmt(p.price * i.qty)}</span></div>
              <p class="muted small">${COLORS[i.color].name} · Rozmiar: ${i.size}</p>
              <div class="cart-row">
                <div class="qty" aria-label="Ilość">
                  <button data-qty="-1" data-key="${i.key}" aria-label="Mniej">−</button>
                  <span>${i.qty}</span>
                  <button data-qty="1" data-key="${i.key}" aria-label="Więcej">+</button>
                </div>
                <button class="link small" data-remove="${i.key}">Usuń</button>
              </div>
            </div>
          </li>`;
        }).join('')}
      </ul>`;

    $('#cartFoot').innerHTML = `
      <div class="totals">
        <div><span>Wartość produktów</span><span>${fmt(sub)}</span></div>
        <div><span>Dostawa</span><span>${ship ? fmt(ship) : 'Gratis'}</span></div>
        <div class="total"><span>Razem</span><span>${fmt(sub + ship)}</span></div>
      </div>
      <button class="btn btn-block" id="checkoutBtn">Przejdź do kasy</button>
      <p class="demo-note">To wersja demonstracyjna — zamówienia i płatności są wyłączone.</p>`;
  }

  /* ---------- panele (koszyk / filtry / modal) ---------- */
  function openPanel(name) {
    document.body.classList.add(`${name}-open`, 'locked');
    if (name === 'cart') { renderCart(); $('#cartDrawer').setAttribute('aria-hidden', 'false'); }
  }
  function closePanels() {
    document.body.classList.remove('cart-open', 'filters-open', 'modal-open', 'menu-open', 'locked');
    $('#cartDrawer').setAttribute('aria-hidden', 'true');
    $('#modal').setAttribute('aria-hidden', 'true');
    $('#menuBtn').setAttribute('aria-expanded', 'false');
    state.modal = null;
  }

  /* ---------- modal produktu ---------- */
  function sizeGuide() {
    const rows = SIZES.slice(0, -1).map((s, i) => `<tr><td>${s}</td><td>${78 + i * 4}</td><td>${60 + i * 4}</td><td>${86 + i * 4}</td></tr>`).join('');
    return `<div class="size-guide"><table><thead><tr><th>EU</th><th>Biust</th><th>Talia</th><th>Biodra</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="muted small">Wymiary w cm. Wybierz „Na wymiar”, a po zamówieniu poprosimy o Twoje wymiary.</p></div>`;
  }

  function openModal(id, color) {
    const p = byId(id);
    state.modal = { id, color: color || cardColorFor(p), size: null, view: 'full', guide: false, error: false };
    renderModal(true);
    document.body.classList.add('modal-open', 'locked');
    $('#modal').setAttribute('aria-hidden', 'false');
  }

  function renderModal(fresh = false) {
    const m = state.modal;
    if (!m) return;
    const p = byId(m.id);
    const box = $('#modalBox');
    const scroll = fresh ? 0 : box.scrollTop;
    const openDetails = fresh ? ['details'] : $$('details', box).filter((d) => d.open).map((d) => d.dataset.k);
    const fav = state.fav.has(p.id);

    box.innerHTML = `
      <button class="icon-btn modal-close" data-close aria-label="Zamknij">
        <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>
      </button>
      <div class="pd">
        <div class="pd-gallery">
          <div class="pd-main ${isLightBg(p) ? 'bg-bridal' : 'bg-color'}">${media(p, m.color, m.view)}</div>
          <div class="pd-thumbs">
            ${Object.entries(VIEWS).map(([k, v]) => `<button class="pd-thumb ${isLightBg(p) ? 'bg-bridal' : 'bg-color'}${k === m.view ? ' is-active' : ''}" data-view="${k}" aria-label="${v.label}">
              ${media(p, m.color, k)}<span>${v.label}</span></button>`).join('')}
          </div>
        </div>
        <div class="pd-info">
          <p class="eyebrow">${CATEGORIES[p.category]}${badgeOf(p) ? ` · <span class="accent">${badgeOf(p)}</span>` : ''}</p>
          <h2 class="pd-title">${p.name}</h2>
          <div class="rating">${stars(p.rating)} <span class="muted small">${p.rating.toFixed(1)} · ${p.reviews} opinii</span></div>
          <p class="pd-price">${priceHTML(p)}</p>
          <p class="pd-desc">${p.description}</p>

          <div class="pd-block">
            <p class="pd-label">Kolor: <strong>${COLORS[m.color].name}</strong></p>
            ${swatchesHTML(p, m.color, 'lg')}
          </div>

          <div class="pd-block">
            <p class="pd-label">Rozmiar${m.size ? `: <strong>${m.size}</strong>` : ''}
              <button class="link small" data-guide>${m.guide ? 'Ukryj tabelę' : 'Tabela rozmiarów'}</button></p>
            <div class="sizes${m.error ? ' is-error' : ''}">
              ${SIZES.map((s) => `<button class="size${s === m.size ? ' is-active' : ''}${s.length > 3 ? ' size-wide' : ''}" data-size="${s}">${s}</button>`).join('')}
            </div>
            ${m.error ? '<p class="pd-error">Wybierz rozmiar, aby dodać suknię do koszyka.</p>' : ''}
            ${m.guide ? sizeGuide() : ''}
          </div>

          <div class="pd-actions">
            <button class="btn btn-block" data-add>Dodaj do koszyka</button>
            <button class="fav fav-lg${fav ? ' is-fav' : ''}" data-fav="${p.id}" aria-label="${fav ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}" aria-pressed="${fav}">
              <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>
            </button>
          </div>

          <ul class="pd-notes">
            <li>Szyta na zamówienie — realizacja 6–8 tygodni</li>
            <li>Darmowa dostawa od ${fmt(FREE_SHIPPING)}</li>
            <li>Bezpłatna przymiarka w atelier</li>
          </ul>

          <details data-k="details"${openDetails.includes('details') ? ' open' : ''}>
            <summary>Szczegóły</summary>
            <dl class="specs">
              <dt>Sylwetka</dt><dd>${SILHOUETTES[p.silhouette]}</dd>
              <dt>Dekolt</dt><dd>${NECKLINES[p.neckline]}</dd>
              <dt>Tkanina</dt><dd>${p.fabric}</dd>
              <dt>Rękawy</dt><dd>${p.sleeves ? 'Długie, transparentne' : 'Bez rękawów'}</dd>
              <dt>Tren</dt><dd>${p.train ? 'Tak, krótki' : 'Nie'}</dd>
              <dt>Zdobienia</dt><dd>${[p.lace && 'koronka', p.sparkle && 'połysk / cekiny', p.sash && 'pas w talii'].filter(Boolean).join(', ') || 'Gładka'}</dd>
            </dl>
          </details>
          <details data-k="ship"${openDetails.includes('ship') ? ' open' : ''}>
            <summary>Dostawa i zwroty</summary>
            <p class="muted">Każda suknia jest szyta specjalnie dla Ciebie. Wysyłamy kurierem w eleganckim pokrowcu. Suknie w standardowych rozmiarach możesz zwrócić w ciągu 30 dni.</p>
          </details>
        </div>
      </div>`;
    box.scrollTop = scroll;
  }

  /* ---------- hero ---------- */
  function renderHero() {
    const picks = [['celestyna', 'white'], ['seraphine', 'ivory'], ['aurelia', 'champagne']];
    $('#heroArt').innerHTML = picks.map(([id, c], i) =>
      `<div class="arch arch-${i + 1}">${DressArt.render(byId(id), COLORS[c].hex)}</div>`).join('');
  }

  /* ---------- akcje ---------- */
  function setCategory(cat) {
    state.category = cat;
    state.favOnly = false;
    state.cardColor = {};
    updateCounts();
    renderAll();
  }

  function clearAll() {
    Object.values(state.f).forEach((s) => s.clear());
    state.favOnly = false;
    state.q = '';
    $('#search').value = '';
    updateCounts();
    renderAll();
  }

  document.addEventListener('click', (e) => {
    const t = e.target;
    const el = (sel) => t.closest(sel);

    // nawigacja po kategoriach
    const catLink = el('[data-cat]');
    if (catLink) { closePanels(); setCategory(catLink.dataset.cat); return; }

    if (el('[data-goto]')) { closePanels(); setCategory(el('[data-goto]').dataset.goto); $('#kolekcja').scrollIntoView({ behavior: 'smooth' }); return; }

    // ulubione
    const favEl = el('[data-fav]');
    if (favEl) {
      e.stopPropagation();
      toggleFav(favEl.dataset.fav);
      if (state.favOnly) renderAll(); else renderGrid();
      if (state.modal) renderModal();
      return;
    }

    // kolor
    const sw = el('[data-swatch]');
    if (sw) {
      if (state.modal && sw.closest('#modal')) { state.modal.color = sw.dataset.swatch; renderModal(); }
      else { state.cardColor[sw.dataset.id] = sw.dataset.swatch; renderGrid(); }
      return;
    }

    // otwarcie podglądu
    const op = el('[data-open]');
    if (op) {
      const fromCart = !!op.closest('#cartDrawer');
      if (fromCart) closePanels();
      openModal(op.dataset.open, op.dataset.color);
      return;
    }

    // modal
    if (state.modal) {
      if (el('[data-view]')) { state.modal.view = el('[data-view]').dataset.view; renderModal(); return; }
      if (el('[data-size]')) { state.modal.size = el('[data-size]').dataset.size; state.modal.error = false; renderModal(); return; }
      if (el('[data-guide]')) { state.modal.guide = !state.modal.guide; renderModal(); return; }
      if (el('[data-add]')) {
        const m = state.modal;
        if (!m.size) { m.error = true; renderModal(); return; }
        addToCart(m.id, m.color, m.size);
        closePanels();
        openPanel('cart');
        toast(`<strong>${byId(m.id).name}</strong> w koszyku · ${COLORS[m.color].name}, ${m.size}`);
        return;
      }
      if (t === $('#modal')) { closePanels(); return; }
    }

    // koszyk
    if (el('[data-qty]')) {
      const b = el('[data-qty]');
      const item = state.cart.find((i) => i.key === b.dataset.key);
      item.qty += +b.dataset.qty;
      if (item.qty < 1) state.cart = state.cart.filter((i) => i !== item);
      saveCart(); updateCounts(); renderCart();
      return;
    }
    if (el('[data-remove]')) {
      state.cart = state.cart.filter((i) => i.key !== el('[data-remove]').dataset.remove);
      saveCart(); updateCounts(); renderCart();
      return;
    }
    if (el('#checkoutBtn')) {
      toast('✦ To tylko podgląd — w tej wersji nie składamy prawdziwych zamówień.');
      return;
    }

    // chipy filtrów
    const chip = el('[data-chip]');
    if (chip) {
      const g = chip.dataset.chip;
      if (g === 'all') clearAll();
      else if (g === 'fav') { state.favOnly = false; updateCounts(); renderAll(); }
      else if (g === 'q') { state.q = ''; $('#search').value = ''; renderAll(); }
      else { state.f[g].delete(chip.dataset.key); renderAll(); }
      return;
    }

    if (el('[data-close]') || t === $('#overlay')) { closePanels(); return; }
  });

  // checkboxy filtrów
  $('#filterGroups').addEventListener('change', (e) => {
    const cb = e.target;
    if (!cb.dataset.group) return;
    const set = state.f[cb.dataset.group];
    cb.checked ? set.add(cb.value) : set.delete(cb.value);
    if (cb.dataset.group === 'color') state.cardColor = {};
    renderAll();
  });

  $('#sort').addEventListener('change', (e) => { state.sort = e.target.value; renderGrid(); });

  let searchTimer;
  $('#search').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.q = e.target.value.trim().toLowerCase();
      renderAll();
      if (state.q) $('#kolekcja').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 220);
  });

  $('#cartBtn').addEventListener('click', () => openPanel('cart'));
  $('#favBtn').addEventListener('click', () => {
    state.favOnly = !state.favOnly;
    updateCounts();
    renderAll();
    $('#kolekcja').scrollIntoView({ behavior: 'smooth' });
  });
  $('#filterBtn').addEventListener('click', () => openPanel('filters'));
  $('#filtersClose').addEventListener('click', closePanels);
  $('#filtersApply').addEventListener('click', closePanels);
  $('#filtersClear').addEventListener('click', clearAll);
  $('#menuBtn').addEventListener('click', () => {
    const open = !document.body.classList.contains('menu-open');
    closePanels();
    if (open) { document.body.classList.add('menu-open'); $('#menuBtn').setAttribute('aria-expanded', 'true'); }
  });
  $('#bookBtn').addEventListener('click', () => toast('✦ Rezerwacje online pojawią się w pełnej wersji strony.'));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanels();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.card-media[data-open]')) {
      e.preventDefault();
      openModal(e.target.dataset.open);
    }
  });

  window.addEventListener('scroll', () => {
    $('#header').classList.toggle('is-scrolled', window.scrollY > 40);
  }, { passive: true });

  /* ---------- start ---------- */
  renderHero();
  renderAll();
  renderCart();
  updateCounts();
})();
