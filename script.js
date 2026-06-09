'use strict';

// клас для товару — зберігає всі дані про одну позицію каталогу.
// id потрібен щоб відрізняти товари між собою (наприклад у кошику),
// badge — маленька наліпка типу "NEW" або "PRO" (може не бути),
// img — шлях до фото, imgDesc — текстовий опис на випадок якщо фото не завантажилось.
class Product {
  constructor({ id, name, brand, category, price, badge, imgDesc, img, sizes, desc }) {
    this.id       = id;
    this.name     = name;
    this.brand    = brand;
    this.category = category;
    this.price    = price;
    this.badge    = badge || null;
    this.imgDesc  = imgDesc;
    this.img      = img || null;
    // якщо розміри не передали — беремо стандартні для категорії
    this.sizes    = sizes || defaultSizesFor(category);
    this.desc     = desc || null;
  }
  // ціна з пробілами між тисячами і символом гривні (48000 -> 48 000)
  formatPrice() {
    return this.price.toLocaleString('uk-UA') + ' ₴';
  }
  // повна назва товару (бренд + модель) — зручно для toast та share
  getLabel() {
    return `${this.brand} ${this.name}`;
  }
  // чи підходить товар під пошук — шукаємо у назві, бренді, категорії та бейджі.
  // переводимо у нижній регістр щоб пошук був без різниці великих/малих літер
  matchesSearch(query) {
    if (!query) return true;
    const q = query.toLowerCase().trim();
    return (
      this.name.toLowerCase().includes(q) ||
      this.brand.toLowerCase().includes(q) ||
      this.category.toLowerCase().includes(q) ||
      (this.badge ? this.badge.toLowerCase().includes(q) : false)
    );
  }
}

// дефолтні розміри для кожної категорії товарів.
// ковзани — у дюймах (6 до 11), шоломи/захист — літерні розміри S-XL,
// ключки — рівні гри JR (junior) / INT (intermediate) / SR (senior)
function defaultSizesFor(category) {
  switch (category) {
    case 'skates':       return ['6','6.5','7','7.5','8','8.5','9','9.5','10','11'];
    case 'helmets':      return ['S','M','L','XL'];
    case 'gloves':       return ['11','12','13','14','15'];
    case 'pads':         return ['S','M','L','XL'];
    case 'sticks':       return ['JR','INT','SR'];
    case 'bags':         return ['JR','SR','PRO'];
    case 'accessories':  return ['JR','SR','ONE'];
    default:             return ['S','M','L','XL'];
  }
}

// весь каталог товарів — масив з обʼєктів Product.
// тут все: ковзани Bauer, CCM, Graf, ключки, шоломи, захист, рукавиці, сумки і аксесуари.
// кожен товар має унікальний id, ціну в копійках і опціональний бейдж (PRO, NEW тощо)
let products = [];   // наповнюється у loadCatalog() з /api/products (БД) або products.json

// кошик зберігається у localStorage між сесіями.
// читаємо при завантаженні; якщо там пусто або битий json — стартуємо з порожнім масивом
let cart = JSON.parse(localStorage.getItem('iv_cart') || '[]');

// зберігає кошик у localStorage. викликаємо після кожної зміни (додав, видалив, змінив кількість)
function saveCart() {
  localStorage.setItem('iv_cart', JSON.stringify(cart));
}

// перемальовує весь UI кошика: цифру біля іконки, суму, список товарів.
// викликається після кожної зміни кошика, щоб користувач бачив актуальний стан
function updateCartUI() {
  // рахуємо загальну кількість одиниць у кошику (сума всіх qty)
  const count = cart.reduce((s, i) => s + i.qty, 0);
  // загальна сума: ціна * кількість для кожного, потім складаємо
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  // кружечок з цифрою біля іконки кошика. робимо легке збільшення для анімації
  const cartCountEl = document.getElementById('cartCount');
  if (cartCountEl) {
    cartCountEl.textContent = count;
    cartCountEl.style.transform = 'scale(1.5)';
    setTimeout(() => { cartCountEl.style.transform = 'scale(1)'; }, 300);
  }

  // сума у форматі "12 500 грн"
  const totalEl = document.getElementById('cartTotal');
  if (totalEl) totalEl.textContent = total.toLocaleString('uk-UA') + ' ₴';

  const itemsEl = document.getElementById('cartItems');
  if (!itemsEl) return;

  // якщо кошик пустий — показуємо плейсхолдер
  if (cart.length === 0) {
    itemsEl.innerHTML = '<div class="cart-empty">Кошик порожній</div>';
    return;
  }

  // будуємо HTML-розмітку для кожного товару через .map() і склеюємо в один рядок.
  // у розмітці: бренд, назва, кнопки +/-, поточна ціна, кнопка видалення
  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <span class="cart-item-name">${item.name}</span>
        <span class="cart-item-brand">${item.brand}</span>
      </div>
      <div class="cart-item-right">
        <div class="cart-item-qty">
          <button class="qty-btn" data-id="${item.id}" data-op="minus">−</button>
          <span>${item.qty}</span>
          <button class="qty-btn" data-id="${item.id}" data-op="plus">+</button>
        </div>
        <span class="cart-item-price">${(item.price * item.qty).toLocaleString('uk-UA')} ₴</span>
        <button class="cart-item-remove" data-id="${item.id}">✕</button>
      </div>
    </div>
  `).join('');

  // вішаємо обробники на кнопки +/- для зміни кількості.
  // якщо кількість дійшла до 0 — товар сам видаляється з кошика
  itemsEl.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const op = btn.dataset.op;
      const idx = cart.findIndex(i => i.id === id);
      if (idx === -1) return;
      if (op === 'plus') { cart[idx].qty++; }
      else if (op === 'minus') {
        cart[idx].qty--;
        if (cart[idx].qty <= 0) cart.splice(idx, 1);
      }
      saveCart();
      updateCartUI();
    });
  });

  // кнопка-хрестик повністю видаляє позицію з кошика
  itemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      cart = cart.filter(i => i.id !== btn.dataset.id);
      saveCart();
      updateCartUI();
    });
  });
}

// додає товар у кошик. спочатку запитує розмір через prompt,
// якщо такий товар уже є — просто збільшуємо кількість, інакше додаємо новий запис
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const size = prompt(`Оберіть розмір для "${product.getLabel()}":\n(наприклад: 7, 7.5, 8, 8.5, 9, 9.5, S, M, L, XL)`);
  if (size === null) return;

  const existing = cart.find(i => i.id === productId);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id: product.id, name: product.name, brand: product.brand, price: product.price, qty: 1, size: size.trim() });
  }
  saveCart();
  updateCartUI();

  openCart();
}

// відкриває бічну панель кошика (drawer) + затемнення фону.
// блокуємо скрол body щоб сторінка не їздила під модалкою
function openCart() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (drawer) drawer.classList.add('open');
  if (overlay) overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

// закриває панель кошика і повертає скрол сторінки
function closeCart() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// привʼязка кнопок керування кошиком:
// іконка в навбарі відкриває, хрестик і клік по затемненню — закривають
const cartBtn = document.getElementById('cartBtn');
if (cartBtn) cartBtn.addEventListener('click', openCart);

const cartClose = document.getElementById('cartClose');
if (cartClose) cartClose.addEventListener('click', closeCart);

const cartOverlay = document.getElementById('cartOverlay');
if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

// при старті малюємо те що було в localStorage (наприклад з минулої сесії)
updateCartUI();

// стан пошуку/фільтрів. зберігаємо тут, щоб фільтр + пошук + категорія працювали разом
const searchState = { query: '', brand: '', size: '' };

// рендерить сітку товарів з урахуванням фільтра по категорії, пошуку, бренду й розміру.
// параметр skipStagger вимикає stagger-анімацію (потрібен коли працює FLIP)
function renderProducts(filter = 'all', opts = {}) {
  const { skipStagger = false } = opts;
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  // спочатку фільтруємо по категорії (або беремо все якщо filter='all')
  let filtered = filter === 'all'
    ? products.slice()
    : products.filter(p => p.category === filter);

  // далі застосовуємо додаткові фільтри: текст пошуку, бренд, розмір.
  // кожен фільтр звужує вибірку
  if (searchState.query)  filtered = filtered.filter(p => p.matchesSearch(searchState.query));
  if (searchState.brand)  filtered = filtered.filter(p => p.brand === searchState.brand);
  if (searchState.size)   filtered = filtered.filter(p => p.sizes.includes(searchState.size));

  // якщо нічого не знайшли — пишемо повідомлення замість карток
  if (filtered.length === 0) {
    grid.innerHTML = '<p class="no-products">Товарів не знайдено</p>';
    return;
  }

  // генеруємо HTML картки для кожного товару через template literals.
  // на картці: фото (або плейсхолдер), кнопка share, оверлей з кнопкою "купити",
  // бренд, бейдж (якщо є), назва, ціна, бейдж наявності (заповниться пізніше)
  grid.innerHTML = filtered.map((p, i) => `
    <div class="product-card" data-cat="${p.category}" data-id="${p.id}" style="--i:${i}">
      <div class="product-img">
        <div class="img-placeholder ${p.img ? 'has-img has-img--contain' : ''}">
          ${p.img
            ? `<img src="${p.img}" alt="${p.imgDesc}" loading="lazy" />`
            : `<div class="ph-label sm"><span class="ph-tag">${p.imgDesc}</span></div>`}
        </div>
        <button class="btn-share" data-share-id="${p.id}" aria-label="Поділитися">↗</button>
        <div class="product-hover-overlay">
          <button class="btn-add-full" data-product-id="${p.id}">Додати в кошик</button>
        </div>
      </div>
      <div class="product-info">
        <div class="product-meta">
          <span class="product-brand">${p.brand}</span>
          ${p.badge ? `<span class="item-badge-sm">${p.badge}</span>` : ''}
        </div>
        <h4 class="product-name">${p.name}</h4>
        <div class="product-price-row">
          <span class="product-price">${p.formatPrice()}</span>
          <span class="stock-badge" id="stock-${p.id}"></span>
        </div>
      </div>
    </div>
  `).join('');

  // вішаємо обробник на кожну кнопку "Додати в кошик" в оверлеї картки
  grid.querySelectorAll('.btn-add-full').forEach(btn => {
    btn.addEventListener('click', () => addToCart(btn.dataset.productId));
  });

  // кнопка share. stopPropagation() щоб не відкрилась модалка картки разом з share-діалогом
  grid.querySelectorAll('.btn-share').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); shareProduct(btn.dataset.shareId); });
  });

  // клік по самій картці відкриває модалку з деталями товару.
  // але якщо клік був по внутрішній кнопці (share/add) — ігноруємо
  grid.querySelectorAll('.product-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-add-full, .btn-share')) return;
      openProductModal(card.dataset.id);
    });
  });

  // підвантажуємо бейджі наявності з бекенду одним запитом (батч)
  loadStockBadges(filtered.map(p => p.id));

  // stagger-анімація: картки зʼявляються по черзі з невеликою затримкою.
  // створює красивий ефект "хвилі" коли каталог завантажується
  if (!skipStagger) {
    grid.querySelectorAll('.product-card').forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(28px)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, i * 55);
    });
  }
}

// плавне переключення фільтрів через техніку FLIP (First-Last-Invert-Play).
// суть: запамʼятовуємо де картки були, перерендерюємо в нові позиції,
// рахуємо різницю і анімуємо рух з старого місця у нове.
// дає ефект ніби картки "переїжджають" а не зникають/зʼявляються
function renderProductsFLIP(filter) {
  const grid = document.getElementById('productsGrid');
  if (!grid || grid.children.length === 0) {
    renderProducts(filter);
    return;
  }
  // FIRST: фіксуємо позиції всіх карток до перерендерингу
  const first = new Map();
  grid.querySelectorAll('.product-card').forEach(card => {
    first.set(card.dataset.id, card.getBoundingClientRect());
  });

  // перемальовуємо без стандартної stagger-анімації — анімувати будемо самі
  renderProducts(filter, { skipStagger: true });

  // LAST + INVERT + PLAY (на наступному кадрі щоб браузер встиг обчислити нові розміри)
  requestAnimationFrame(() => {
    grid.querySelectorAll('.product-card').forEach((card, i) => {
      const f = first.get(card.dataset.id);
      const l = card.getBoundingClientRect();
      if (f) {
        // якщо картка вже була — рахуємо зсув від старої позиції
        const dx = f.left - l.left;
        const dy = f.top - l.top;
        if (dx === 0 && dy === 0) return;
        // INVERT: миттєво ставимо картку на стару позицію через translate
        card.style.transform = `translate(${dx}px, ${dy}px)`;
        card.style.transition = 'none';
        // PLAY: на наступному кадрі знімаємо transform — браузер плавно поверне в нову позицію
        requestAnimationFrame(() => {
          card.style.transition = 'transform .55s cubic-bezier(.16,1,.3,1)';
          card.style.transform = '';
        });
      } else {
        // нова картка (її раніше не було) — просто плавно зʼявляється з низу
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px) scale(.96)';
        setTimeout(() => {
          card.style.transition = 'opacity .45s, transform .45s cubic-bezier(.16,1,.3,1)';
          card.style.opacity = '1';
          card.style.transform = '';
        }, i * 30);
      }
    });
  });
}

// скелетони — сірі плейсхолдер-картки, які показуємо доки товари "завантажуються".
// насправді товари локальні і доступні одразу, але це додає відчуття плавності.
// у диплом це йде як приклад прийому покращення UX
function renderSkeletons(count = 8) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  const html = Array.from({ length: count }, () => `
    <div class="product-card skeleton">
      <div class="product-img"><div class="skel-block"></div></div>
      <div class="product-info">
        <div class="skel-line skel-line--sm"></div>
        <div class="skel-line skel-line--lg"></div>
        <div class="skel-line skel-line--md"></div>
      </div>
    </div>
  `).join('');
  grid.innerHTML = html;
}

// при першому завантаженні: дивимось чи є фільтр у URL (?filter=skates),
// показуємо скелетони, потім тягнемо каталог з БД і рендеримо
const _initialFilter = new URLSearchParams(window.location.search).get('filter') || 'all';
renderSkeletons();
loadCatalog();   // завантажує каталог з /api/products (БД) або products.json, далі рендерить

const filterRow = document.getElementById('filterRow');
function activeCategory() {
  const btn = filterRow ? filterRow.querySelector('.filter-btn.active') : null;
  return btn ? btn.dataset.filter : 'all';
}
// кнопки категорій (Все / Ковзани / Ключки і т.д.).
// при кліку: знімаємо active з усіх, ставимо active на натиснуту, перемальовуємо з FLIP-анімацією,
// оновлюємо URL через history API щоб можна було копіювати посилання з фільтром
if (filterRow) {
  filterRow.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterRow.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      renderProductsFLIP(f);
      const url = new URL(window.location);
      if (f === 'all') url.searchParams.delete('filter'); else url.searchParams.set('filter', f);
      history.pushState({ filter: f }, '', url);
    });
  });
}

// заповнює селекти бренду й розміру варіантами які реально є в каталозі.
// Set прибирає дублікати (наприклад Bauer зустрічається в багатьох товарах — у списку буде один раз)
function populateSearchSelects() {
  const brandSel = document.getElementById('filterBrand');
  const sizeSel  = document.getElementById('filterSize');
  if (!brandSel || !sizeSel) return;

  const brands = [...new Set(products.map(p => p.brand))].sort();
  brands.forEach(b => {
    const o = document.createElement('option');
    o.value = b; o.textContent = b;
    brandSel.appendChild(o);
  });

  // збираємо всі розміри з усіх товарів і сортуємо так,
  // щоб числові (6, 6.5, 7...) йшли спочатку, а літерні (S, M, L) — потім
  const sizes = [...new Set(products.flatMap(p => p.sizes))];
  sizes.sort((a,b) => {
    const na = parseFloat(a), nb = parseFloat(b);
    const aNum = !isNaN(na), bNum = !isNaN(nb);
    if (aNum && bNum) return na - nb;
    if (aNum) return -1;
    if (bNum) return 1;
    return a.localeCompare(b);
  });
  sizes.forEach(s => {
    const o = document.createElement('option');
    o.value = s; o.textContent = s;
    sizeSel.appendChild(o);
  });
}

// завантаження каталогу: спершу пробуємо API (БД) /api/products, при збої — статичний products.json
// (щоб демо на GitHub Pages без сервера теж працювало). Мапимо у екземпляри Product,
// заповнюємо селекти фільтрів і рендеримо каталог.
async function loadCatalog() {
  let data = [];
  try {
    const r = await fetch('/api/products');
    if (!r.ok) throw new Error('api ' + r.status);
    data = await r.json();
  } catch {
    try { data = await (await fetch('products.json')).json(); }
    catch (e) { console.error('catalog load failed', e); }
  }
  products = data.map(d => new Product(d));
  populateSearchSelects();
  renderProducts(_initialFilter);
}

const searchInput  = document.getElementById('searchInput');
const filterBrand  = document.getElementById('filterBrand');
const filterSize   = document.getElementById('filterSize');
const searchReset  = document.getElementById('searchReset');

// debounce — затримка щоб не перерендерювати на кожен натиск клавіші.
// тільки коли користувач зупинився на 180мс — запускаємо пошук
let searchDebounce = null;
function applySearch() {
  renderProductsFLIP(activeCategory());
}

// поле пошуку працює з debounce — інакше при швидкому введенні буде лагати
if (searchInput) {
  searchInput.addEventListener('input', e => {
    searchState.query = e.target.value;
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(applySearch, 180);
  });
}
if (filterBrand) {
  filterBrand.addEventListener('change', e => {
    searchState.brand = e.target.value;
    applySearch();
  });
}
if (filterSize) {
  filterSize.addEventListener('change', e => {
    searchState.size = e.target.value;
    applySearch();
  });
}
// кнопка-хрестик у пошуку — скидає всі фільтри одночасно
if (searchReset) {
  searchReset.addEventListener('click', () => {
    searchState.query = ''; searchState.brand = ''; searchState.size = '';
    if (searchInput)  searchInput.value  = '';
    if (filterBrand)  filterBrand.value  = '';
    if (filterSize)   filterSize.value   = '';
    applySearch();
  });
}

// клік по логотипу бренду (Bauer/CCM/...) у секції брендів.
// скролимо до каталогу і пригасуємо товари інших брендів (opacity 0.25)
document.querySelectorAll('[data-filter-brand]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const brand = link.dataset.filterBrand;
    const catalogSection = document.getElementById('catalog');
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        renderProducts('all');
        const grid = document.getElementById('productsGrid');
        if (grid) {
          grid.querySelectorAll('.product-card').forEach(card => {
            const brandEl = card.querySelector('.product-brand');
            if (brandEl && !brandEl.textContent.includes(brand)) {
              card.style.opacity = '0.25';
            }
          });
        }
      }, 600);
    }
  });
});

// кнопки "+ Додати" на статичних картках топ-колекції (у HTML, не в каталозі)
document.querySelectorAll('.btn-add').forEach(btn => {
  btn.addEventListener('click', () => {
    addToCart(btn.dataset.id);
  });
});

// годинник: оновлює час у навбарі, дату й час на hero, рік у футері та у блоці розробника.
// викликається кожну секунду через setInterval
function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const timeStr = `${hh}:${mm}:${ss}`;

  const dd = String(now.getDate()).padStart(2, '0');
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const dateStr = `${dd} / ${mo} / ${yyyy}`;

  const navClock = document.getElementById('navClock');
  if (navClock) navClock.textContent = timeStr;

  const heroDate = document.getElementById('heroDate');
  if (heroDate) heroDate.textContent = dateStr;

  const heroTime = document.getElementById('heroTime');
  if (heroTime) heroTime.textContent = timeStr;

  const mobileDate = document.getElementById('mobileDate');
  if (mobileDate) mobileDate.textContent = `${dd}.${mo}.${yyyy}`;

  const footerYear = document.getElementById('footerYear');
  if (footerYear) footerYear.textContent = yyyy;

  const devYear = document.getElementById('devYear');
  if (devYear) devYear.textContent = yyyy;
}

// одразу намалювати, далі — щосекунди
updateClock();
setInterval(updateClock, 1000);

// лічильник часу на сайті (в футері: "Час на сайті 02:34").
// показує скільки хвилин:секунд людина вже на сторінці
let sessionSeconds = 0;
const sessionEl = document.getElementById('sessionTimer');

function tickSession() {
  sessionSeconds++;
  const m = String(Math.floor(sessionSeconds / 60)).padStart(2, '0');
  const s = String(sessionSeconds % 60).padStart(2, '0');
  if (sessionEl) sessionEl.textContent = `${m}:${s}`;
}

let sessionInterval = setInterval(tickSession, 1000);

// Page Visibility API — якщо користувач переключив таб, зупиняємо лічильник.
// інакше час "на сайті" накручується навіть коли людина дивиться інший таб
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearInterval(sessionInterval);
  } else {
    sessionInterval = setInterval(tickSession, 1000);
  }
});

// визначення браузера — показуємо у блоці "про розробника".
// беремо navigator.userAgent і шукаємо характерні маркери.
// важливо: Edg/ перевіряти ПЕРЕД Chrome/ — бо Edge теж містить "Chrome/" у своєму UA
const devBrowserEl = document.getElementById('devBrowser');
if (devBrowserEl) {
  const ua = navigator.userAgent;
  let browserName = 'Невідомий';
  if (ua.includes('Edg/'))          browserName = 'Microsoft Edge';
  else if (ua.includes('Chrome/'))  browserName = 'Google Chrome';
  else if (ua.includes('Firefox/')) browserName = 'Mozilla Firefox';
  else if (ua.includes('Safari/'))  browserName = 'Apple Safari';
  else if (ua.includes('Opera/'))   browserName = 'Opera';
  devBrowserEl.textContent = browserName;
}

// привітання при першому візиті
if (!localStorage.getItem('iv_visited')) {
  setTimeout(() => {
    if (typeof showToast === 'function') showToast('Ласкаво просимо до ICEVAULT — преміум хокей.');
    localStorage.setItem('iv_visited', '1');
  }, 1800);
}

// кастомний курсор: точка йде точно за мишкою, follower трохи відстає.
// зберігаємо координати у двох парах змінних — поточну позицію миші і поточну позицію follower
const cursor = document.getElementById('cursor');
const follower = document.getElementById('cursorFollower');
let mouseX = 0, mouseY = 0, folX = 0, folY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (cursor) { cursor.style.left = mouseX + 'px'; cursor.style.top = mouseY + 'px'; }
});

// функція анімації follower через requestAnimationFrame.
// folX += (mouseX - folX) * 0.11 — це easing: follower кожен кадр зміщується на 11% дистанції до миші.
// дає плавне "наздоганяння"
(function animFol() {
  folX += (mouseX - folX) * 0.11;
  folY += (mouseY - folY) * 0.11;
  if (follower) { follower.style.left = folX + 'px'; follower.style.top = folY + 'px'; }
  requestAnimationFrame(animFol);
})();

// при наведенні на інтерактивні елементи додаємо клас body — курсор стає більший (стилізується в CSS)
document.querySelectorAll('a, button, .product-card, .col-item, .brand-block, .faq-q').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

// один обробник скролу робить 3 речі одночасно (оптимізація — не вішати 3 окремих).
// passive:true каже браузеру що ми не будемо викликати preventDefault — він може скролити плавніше
const nav = document.getElementById('nav');
const progressBar = document.getElementById('scrollProgress');

window.addEventListener('scroll', () => {
  // 1) клас .scrolled на навбарі коли скролимо нижче 60px — фон стає трохи темніший і зʼявляється blur
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);

  // 2) полоска прогресу скролу зверху — ширина у відсотках від (висота_документа - висота_вікна)
  if (progressBar) {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
    progressBar.style.width = pct + '%';
  }

  // 3) кнопка "вгору" зʼявляється коли проскролили далі ніж 500px
  const bt = document.getElementById('backTop');
  if (bt) bt.classList.toggle('visible', window.scrollY > 500);
}, { passive: true });

// анімації при скролі через IntersectionObserver — сучасна заміна для перевірки "чи елемент у viewport".
// коли елемент зʼявляється у viewport (threshold 0.15 = 15% видимості) — додаємо клас .visible,
// CSS бачить цей клас і запускає transition (fade-up / clip-reveal).
// unobserve() після першого запуску — щоб анімація не повторювалась
function initScrollAnimations() {
  const opts = { threshold: 0.15, rootMargin: '0px 0px -50px 0px' };

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = el.style.getPropertyValue('--delay') || '0s';
      el.style.transitionDelay = delay;
      el.classList.add('visible');
      obs.unobserve(el);
    });
  }, opts);

  document.querySelectorAll('.clip-reveal, .fade-up').forEach(el => obs.observe(el));
}

// requestIdleCallback — запускаємо анімації коли браузер вільний.
// для старих браузерів (Safari ще не підтримує) — fallback на одразу
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => initScrollAnimations(), { timeout: 400 });
} else {
  initScrollAnimations();
}

// паралакс фону hero-секції: під час скролу фон рухається повільніше (множник 0.18) ніж сам контент.
// створює відчуття глибини. передаємо у CSS-змінну --sy яка використовується у transform
const heroBg = document.querySelector('.hero-bg');
if (heroBg) {
  window.addEventListener('scroll', () => {
    heroBg.style.setProperty('--sy', (window.scrollY * 0.18) + 'px');
  }, { passive: true });
}

// якщо URL містить ?filter=skates — підсвічуємо відповідну кнопку категорії
function applyFilterFromURL() {
  const filter = new URLSearchParams(window.location.search).get('filter') || 'all';
  const filterRow2 = document.getElementById('filterRow');
  if (filterRow2) {
    filterRow2.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.filter === filter);
    });
  }
}

// popstate — спрацьовує коли користувач тисне "назад" або "вперед" у браузері.
// підставляємо потрібний фільтр і перемальовуємо каталог
window.addEventListener('popstate', e => {
  const filter = e.state?.filter || 'all';
  renderProducts(filter);
  if (filterRow) filterRow.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
});

applyFilterFromURL();

// анімація цифр-лічильників (від 0 до target)
// анімація цифр-лічильників (від 0 до target за 1.6 секунди).
// розбиваємо тривалість на кроки по 16мс (~60fps) і додаємо невеликий інкремент на кожному.
// у фіналі ставимо точне target щоб уникнути floating point похибок
function countUp(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1600;
  const step = 16;
  const steps = duration / step;
  let current = 0;
  const inc = target / steps;

  const timer = setInterval(() => {
    current += inc;
    if (current >= target) {
      el.textContent = target + (el.dataset.suffix || '');
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(current) + (el.dataset.suffix || '');
    }
  }, step);
}

// запускаємо countUp коли число зʼявляється у viewport на 50%.
// інакше анімація відіграє ще до того як користувач догортав до неї
const countObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      countUp(entry.target);
      countObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.count-up').forEach(el => countObs.observe(el));

// мобільне меню: кнопка-бургер відкриває/закриває.
// data-close на посиланнях усередині меню — щоб меню закривалось після кліку на пункт
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    menuBtn.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  document.querySelectorAll('[data-close]').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      menuBtn.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// кнопка "вгору" — плавний скрол до самого верху сторінки
const backTop = document.getElementById('backTop');
if (backTop) {
  backTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// плавний скрол до якорів (#about, #catalog тощо). без цього браузер просто "стрибає"
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

// форма підписки на знижку (CTA-блок).
// preventDefault щоб не перезавантажувалась сторінка, валідуємо email регуляркою,
// якщо все добре — показуємо "Підписано", через 4 секунди повертаємо звичайний стан
const ctaForm = document.getElementById('ctaForm');
if (ctaForm) {
  ctaForm.addEventListener('submit', e => {
    e.preventDefault();
    const input = ctaForm.querySelector('input');
    const btn = ctaForm.querySelector('button[type="submit"]');
    if (!input.value || !/\S+@\S+\.\S+/.test(input.value)) {
      alert('Будь ласка, введіть коректний email.');
      return;
    }
    btn.textContent = 'Підписано';
    btn.disabled = true;
    btn.style.opacity = '0.7';
    input.value = '';
    setTimeout(() => { btn.textContent = 'Підписатися'; btn.disabled = false; btn.style.opacity = ''; }, 4000);
  });
}

// форма контактів на сторінці contacts.html — з валідацією і відправкою на бекенд.
// весь код у блоці if(contactForm), щоб не виконувався на інших сторінках
const contactForm = document.getElementById('contactForm');
if (contactForm) {

  // показати помилку під полем: ставимо клас has-error батьку (підсвічує бордюр червоним)
  // і вписуємо текст у span з повідомленням
  function setError(fieldId, msg) {
    const fg = document.getElementById('fg-' + fieldId);
    const err = document.getElementById('err-' + fieldId);
    if (fg) fg.classList.add('has-error');
    if (err) err.textContent = msg;
  }

  // прибрати помилку (коли користувач виправив поле)
  function clearError(fieldId) {
    const fg = document.getElementById('fg-' + fieldId);
    const err = document.getElementById('err-' + fieldId);
    if (fg) fg.classList.remove('has-error');
    if (err) err.textContent = '';
  }

  // перевіряє всі поля. повертає true якщо все ок.
  // правила: імʼя від 2 символів, email по регулярці, телефон опціональний,
  // тема обовʼязкова, повідомлення від 10 символів, чекбокс згоди має бути натиснутий
  function validateForm() {
    let valid = true;
    ['name','email','subject','msg','agree'].forEach(f => clearError(f));

    const name = document.getElementById('cName');
    const email = document.getElementById('cEmail');
    const phone = document.getElementById('cPhone');
    const subject = document.getElementById('cSubject');
    const msg = document.getElementById('cMsg');
    const agree = document.getElementById('cAgree');

    if (!name || name.value.trim().length < 2) { setError('name', "Введіть ім'я (мін. 2 символи)"); valid = false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) { setError('email', 'Введіть коректний email'); valid = false; }
    if (phone && phone.value && !/^[\d\s\+\(\)\-]{7,18}$/.test(phone.value)) { setError('phone', 'Невірний формат телефону'); valid = false; }
    if (!subject || !subject.value) { setError('subject', 'Оберіть тему'); valid = false; }
    if (!msg || msg.value.trim().length < 10) { setError('msg', 'Повідомлення мін. 10 символів'); valid = false; }
    if (!agree || !agree.checked) { setError('agree', 'Необхідно прийняти умови'); valid = false; }

    return valid;
  }

  // real-time валідація: при blur (втраті фокусу) перевіряємо форму.
  // користувач одразу бачить помилки замість того щоб чекати submit
  ['cName','cEmail','cPhone','cMsg'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('blur', validateForm);
  });

  // обробник submit. async бо всередині await на fetch
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');
    const formStatus = document.getElementById('formStatus');

    // ховаємо текст кнопки, показуємо спінер, блокуємо повторне натискання
    if (submitText) submitText.style.display = 'none';
    if (submitSpinner) submitSpinner.style.display = 'inline-block';
    if (submitBtn) submitBtn.disabled = true;

    // збираємо дані з форми у обʼєкт для відправки
    const payload = {
      name:    document.getElementById('cName').value.trim(),
      email:   document.getElementById('cEmail').value.trim(),
      phone:   document.getElementById('cPhone')?.value.trim() || '',
      subject: document.getElementById('cSubject').value,
      message: document.getElementById('cMsg').value.trim(),
    };

    // 2 канали відправки: спочатку пробуємо власний бекенд (/api/contact).
    // якщо сервер не запущений (наприклад на GitHub Pages) — переходимо на Web3Forms як запасний варіант
    let ok = false;
    try {
      const r = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || ('HTTP ' + r.status));
      ok = true;
    } catch {
      // fallback: Web3Forms — стороння служба яка пересилає форми на email власника api-ключа
      try {
        const r = await fetch('https://api.web3forms.com/submit', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: '9f196991-7ce7-49ea-a397-ad2eb9b111dd',
            subject: `ICEVAULT contact: ${payload.subject}`,
            from_name: 'ICEVAULT contact form',
            email: 'sinelnikovruslan45@gmail.com',
            replyto: payload.email,
            message: `Імʼя: ${payload.name}\nEmail: ${payload.email}\nТел: ${payload.phone}\nТема: ${payload.subject}\n\n${payload.message}`,
          }),
        });
        const d = await r.json().catch(() => ({}));
        ok = !!d.success;
      } catch {}
    }

    if (submitSpinner) submitSpinner.style.display = 'none';
    if (submitText) submitText.style.display = '';
    if (ok) {
      if (submitText) submitText.textContent = 'Надіслано';
      if (formStatus) {
        formStatus.textContent = 'Дякуємо! Ваше повідомлення успішно надіслано. Ми звʼяжемось з вами протягом 24 годин.';
        formStatus.className = 'form-status success';
      }
      contactForm.reset();
    } else {
      if (submitText) submitText.textContent = 'Помилка';
      if (formStatus) {
        formStatus.textContent = 'Не вдалося надіслати. Спробуйте пізніше або напишіть на sinelnikovruslan45@gmail.com';
        formStatus.className = 'form-status error';
      }
    }
    setTimeout(() => {
      if (submitBtn) submitBtn.disabled = false;
      if (submitText) submitText.textContent = 'Надіслати';
    }, 4000);
  });

  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      ['name','email','phone','subject','msg','agree'].forEach(f => clearError(f));
      const formStatus = document.getElementById('formStatus');
      if (formStatus) { formStatus.textContent = ''; formStatus.className = 'form-status'; }
    });
  }
}

// FAQ accordion: клік по питанню розкриває відповідь.
// принцип "по одному відкрито": всі закриваємо, потім відкриваємо натиснуте (якщо було закрите)
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

// показує спливаюче повідомлення внизу екрану (toast).
// створюємо div, додаємо у body, у двох requestAnimationFrame ставимо клас
// (хитрість щоб transition спрацював, а не просто показався без анімації).
// через 2.5с прибираємо клас (плавне зникнення), через ще 0.4с видаляємо з DOM
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('toast--show'));
  });
  setTimeout(() => {
    toast.classList.remove('toast--show');
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

// поділитись товаром.
// на мобільних — використовуємо системний share (Web Share API), на десктопах — копіюємо у буфер обміну.
// AbortError виникає коли користувач закрив share-діалог сам — не показуємо помилку
async function shareProduct(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  // в URL додаємо фільтр по категорії, щоб одержувач відкрив сайт з тим самим фільтром
  const url = new URL(window.location.href);
  url.searchParams.set('filter', product.category);

  const shareData = {
    title: product.getLabel(),
    text: `${product.getLabel()} — ${product.formatPrice()} | ICEVAULT`,
    url: url.toString(),
  };

  try {
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(url.toString());
      showToast('Посилання скопійовано');
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      showToast('Помилка при копіюванні');
    }
  }
}

// гарячі клавіші для зручності.
// перевіряємо що користувач НЕ друкує в полі вводу — інакше при наборі тексту "С" відкриватиметься кошик.
// C — кошик, Esc — закрити модалки, Alt+стрілка вгору — скрол на гору, ? — показати підказку
document.addEventListener('keydown', e => {
  if (e.target.matches('input, textarea, select')) return;

  switch (e.key) {
    case 'c': case 'C':
      if (document.getElementById('cartDrawer')?.classList.contains('open')) { closeCart(); }
      else { openCart(); }
      break;

    case 'Escape':
      closeCart();
      closeProductModal();
      if (mobileMenu?.classList.contains('open')) {
        mobileMenu.classList.remove('open');
        menuBtn?.classList.remove('open');
        document.body.style.overflow = '';
      }
      break;

    case 'ArrowUp':
      if (e.altKey) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      break;

    case '?': {
      showToast('C — кошик  ·  Esc — закрити  ·  Alt+↑ — вгору');
      break;
    }
  }
});

// тема: спершу беремо вибір користувача, потім — системну
const THEME_KEY = 'iv_theme';
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}
const userTheme = localStorage.getItem(THEME_KEY);
if (userTheme) {
  applyTheme(userTheme);
} else {
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  applyTheme(prefersLight ? 'light' : 'dark');
}
// якщо користувач сам не обрав тему — реагуємо на зміну системної (наприклад вночі система переключилась)
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
  if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? 'light' : 'dark');
});

// кнопка-перемикач теми. зберігаємо вибір у localStorage, щоб при наступному відкритті памʼятати
const themeToggleBtn = document.getElementById('themeToggle');
if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
    showToast(next === 'light' ? 'Світла тема' : 'Темна тема');
  });
}

// динамічно малюємо favicon на canvas і показуємо лічильник кошика поверх іконки.
// крута фішка: коли користувач додає товар у кошик, бачить червоний кружечок з цифрою прямо на вкладці браузера
function updateFavicon() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');

  // фон-шайба: чорне коло
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - 2, 0, Math.PI * 2);
  ctx.fill();

  // золоте кільце по краях — стиль преміум
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - 7, 0, Math.PI * 2);
  ctx.stroke();

  // монограма "IV" по центру (бренд icevault)
  ctx.fillStyle = '#f0ede8';
  ctx.font = 'bold 22px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('IV', size/2, size/2 + 1);

  // якщо у кошику щось є — малюємо червоний кружечок з цифрою у правому верхньому куті
  const count = cart.reduce((s, i) => s + i.qty, 0);
  if (count > 0) {
    ctx.fillStyle = '#e62e2e';
    ctx.beginPath();
    ctx.arc(size - 14, 14, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(count > 9 ? '9+' : String(count), size - 14, 15);
  }

  // підмінюємо <link rel="icon"> через base64 PNG згенерований з canvas
  let link = document.getElementById('favicon');
  if (!link) {
    link = document.createElement('link');
    link.id = 'favicon';
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.type = 'image/png';
  link.href = canvas.toDataURL('image/png');
}

// малюємо favicon один раз при старті,
// далі "обгортаємо" updateCartUI щоб favicon оновлювався після кожної зміни кошика
updateFavicon();
const _origUpdateCartUI = updateCartUI;
updateCartUI = function() {
  _origUpdateCartUI.apply(this, arguments);
  updateFavicon();
};

// паралакс hero за рухом миші. суть: фон і контент рухаються у протилежні боки —
// створює відчуття глибини, ніби сцена 3D. оновлення через requestAnimationFrame щоб не тригерити layout зайвий раз.
// mouseDx/mouseDy — від -0.5 до 0.5 (позиція миші відносно центру блоку)
const heroEl = document.getElementById('hero');
const heroBgEl = document.querySelector('.hero-bg');
const heroContentEl = document.querySelector('.hero-content');
let parallaxRAF = null;

if (heroEl && heroBgEl && heroContentEl) {
  let mouseDx = 0, mouseDy = 0;
  heroEl.addEventListener('mousemove', e => {
    const rect = heroEl.getBoundingClientRect();
    mouseDx = ((e.clientX - rect.left) / rect.width - 0.5);
    mouseDy = ((e.clientY - rect.top) / rect.height - 0.5);
    // запускаємо оновлення тільки якщо попередній кадр вже відбувся (throttling через RAF)
    if (!parallaxRAF) {
      parallaxRAF = requestAnimationFrame(() => {
        // фон рухається у протилежний бік (множник -22) — створює ілюзію глибини
        heroBgEl.style.setProperty('--mx', (mouseDx * -22) + 'px');
        heroBgEl.style.setProperty('--my', (mouseDy * -22) + 'px');
        // контент рухається у бік миші, але слабше — субтильно
        heroContentEl.style.setProperty('--mx', (mouseDx * 14) + 'px');
        heroContentEl.style.setProperty('--my', (mouseDy * 8)  + 'px');
        parallaxRAF = null;
      });
    }
  });
  heroEl.addEventListener('mouseleave', () => {
    heroBgEl.style.setProperty('--mx', '0px');
    heroBgEl.style.setProperty('--my', '0px');
    heroContentEl.style.setProperty('--mx', '0px');
    heroContentEl.style.setProperty('--my', '0px');
  });
}

// 3D-нахил карток при наведенні мишею.
// rotateY залежить від X-координати, rotateX від Y (знак мінус — щоб картка "дивилась" на курсор).
// perspective(800px) задає глибину перспективи, scale(1.02) — легке збільшення.
// при mouseleave скидаємо transform — картка повертається у нормальний стан
document.querySelectorAll('.hover-tilt').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) scale(1.02)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// кроки опитування для AI-помічника підбору
const AI_STEPS = [
  {
    key: 'position',
    title: 'Яка твоя позиція на льоду?',
    options: [
      { value: 'forward',  label: 'Нападник',  hint: 'Швидкість і кидок' },
      { value: 'defense',  label: 'Захисник',  hint: 'Сила і силова боротьба' },
      { value: 'goalie',   label: 'Воротар',   hint: 'Воротарська позиція' },
    ],
  },
  {
    key: 'level',
    title: 'Який твій рівень гри?',
    options: [
      { value: 'beginner', label: 'Початківець', hint: 'Перші сезони на льоду' },
      { value: 'amateur',  label: 'Аматор',      hint: 'Граю регулярно у лізі' },
      { value: 'pro',      label: 'Просунутий',  hint: 'Турніри, високий рівень' },
    ],
  },
  {
    key: 'budget',
    title: 'Який орієнтовний бюджет?',
    options: [
      { value: 'low',  label: 'до 8 000 ₴',     hint: 'Доступний сегмент' },
      { value: 'mid',  label: '8 000–20 000 ₴', hint: 'Збалансовано' },
      { value: 'high', label: '20 000+ ₴',      hint: 'Топ-екіпіровка' },
    ],
  },
  {
    key: 'need',
    title: 'Що шукаєш насамперед?',
    options: [
      { value: 'skates',       label: 'Ковзани' },
      { value: 'sticks',       label: 'Ключку' },
      { value: 'helmets',      label: 'Шолом' },
      { value: 'pads',         label: 'Захист' },
      { value: 'gloves',       label: 'Рукавиці' },
      { value: 'bags',         label: 'Сумку' },
      { value: 'accessories',  label: 'Аксесуари' },
    ],
  },
];

// поточний стан опитування: на якому ми кроці й що користувач уже відповів
const aiState = { step: 0, answers: {} };

// маппимо ціну у бюджетну категорію: дешеві / середні / дорогі
function priceBucket(p) {
  if (p < 8000)  return 'low';
  if (p < 20000) return 'mid';
  return 'high';
}

// головний алгоритм підбору товарів.
// беремо відповіді користувача (категорія, бюджет, позиція, рівень) і повертаємо топ-3 товари.
// логіка: 1) фільтр по категорії, 2) фільтр воротар/польовий, 3) бюджет, 4) ранжування за рівнем
function aiRecommend() {
  const { need, budget, position, level } = aiState.answers;
  let pool = products.filter(p => p.category === need);

  // якщо обрав воротаря — показуємо тільки воротарські товари (з бейджем GOAL або словом goal у назві).
  // якщо польовий гравець — навпаки прибираємо воротарські щоб не плутати
  if (position === 'goalie') {
    const goalieItems = pool.filter(p => (p.badge || '').toUpperCase().includes('GOAL') || /goal/i.test(p.name));
    if (goalieItems.length > 0) pool = goalieItems;
  } else {
    pool = pool.filter(p => !/goal|goalie/i.test(p.name) && !(p.badge || '').toUpperCase().includes('GOAL'));
  }

  // фільтр по бюджету. якщо у вибраний діапазон потрапило мало товарів —
  // розширюємо: сортуємо весь pool по близькості ціни до "ідеальної" точки бюджету
  let inBudget = pool.filter(p => priceBucket(p.price) === budget);
  if (inBudget.length < 2) {
    inBudget = pool.sort((a, b) => Math.abs(a.price - bucketTarget(budget)) - Math.abs(b.price - bucketTarget(budget)));
  }

  // ранжування за рівнем гри: про-гравцям — PRO/TOP товари, початківцям — без таких бейджів.
  // це робить підбір "розумним" а не випадковим
  const proWords = ['PRO','TOP','TOP PRO','NEW','HANDMADE'];
  const score = (p) => {
    let s = 0;
    if (level === 'pro' && proWords.includes((p.badge || '').toUpperCase()))    s += 3;
    if (level === 'beginner' && !proWords.includes((p.badge || '').toUpperCase())) s += 2;
    if (level === 'amateur') s += 1;
    return s;
  };
  inBudget.sort((a, b) => score(b) - score(a));

  // повертаємо тільки топ-3 — щоб не перевантажувати користувача варіантами
  return inBudget.slice(0, 3);
}

// "ідеальна" ціна у середині бюджетного діапазону — щоб шукати найближчі товари
function bucketTarget(b) {
  return b === 'low' ? 5000 : b === 'mid' ? 14000 : 30000;
}

// рендерить поточний крок опитування. показує прогрес-бар, питання, варіанти відповіді,
// і кнопку "Назад" (з 2-го кроку). коли всі кроки пройдені — переходить до результату
function renderAiStep() {
  const body = document.getElementById('aiBody');
  if (!body) return;
  const step = AI_STEPS[aiState.step];
  if (!step) { renderAiResult(); return; }

  const progress = Math.round(((aiState.step) / AI_STEPS.length) * 100);
  body.innerHTML = `
    <div class="ai-progress"><div class="ai-progress-bar" style="width:${progress}%"></div></div>
    <div class="ai-step-num">Крок ${aiState.step + 1} з ${AI_STEPS.length}</div>
    <h4 class="ai-q">${step.title}</h4>
    <div class="ai-options">
      ${step.options.map(o => `
        <button class="ai-option" data-val="${o.value}">
          <span class="ai-option-label">${o.label}</span>
          ${o.hint ? `<span class="ai-option-hint">${o.hint}</span>` : ''}
        </button>
      `).join('')}
    </div>
    ${aiState.step > 0 ? `<button class="ai-back" id="aiBack">← Назад</button>` : ''}
  `;
  body.querySelectorAll('.ai-option').forEach(btn => {
    btn.addEventListener('click', () => {
      aiState.answers[step.key] = btn.dataset.val;
      aiState.step++;
      renderAiStep();
    });
  });
  const back = document.getElementById('aiBack');
  if (back) back.addEventListener('click', () => { aiState.step--; renderAiStep(); });
}

function renderAiResult() {
  const body = document.getElementById('aiBody');
  if (!body) return;
  const recs = aiRecommend();
  body.innerHTML = `
    <div class="ai-progress"><div class="ai-progress-bar" style="width:100%"></div></div>
    <h4 class="ai-q">Підібрали для тебе:</h4>
    <p class="ai-result-sub">На основі позиції, рівня та бюджету.</p>
    <div class="ai-results">
      ${recs.length === 0 ? '<p class="ai-empty">Не знайшли точних збігів. Спробуй розширити бюджет.</p>' :
        recs.map(p => `
          <div class="ai-rec">
            <div class="ai-rec-img">${p.img ? `<img src="${p.img}" alt="${p.imgDesc}" loading="lazy"/>` : ''}</div>
            <div class="ai-rec-info">
              <span class="ai-rec-brand">${p.brand}</span>
              <span class="ai-rec-name">${p.name}</span>
              <span class="ai-rec-price">${p.formatPrice()}</span>
            </div>
            <button class="ai-rec-add" data-add="${p.id}">+ Кошик</button>
          </div>
        `).join('')}
    </div>
    <div class="ai-actions">
      <button class="ai-restart" id="aiRestart">↺ Спочатку</button>
      <a class="ai-to-catalog" href="index.html#catalog">До каталогу →</a>
    </div>
  `;
  body.querySelectorAll('.ai-rec-add').forEach(btn => {
    btn.addEventListener('click', () => addToCart(btn.dataset.add));
  });
  const restart = document.getElementById('aiRestart');
  if (restart) restart.addEventListener('click', () => {
    aiState.step = 0; aiState.answers = {}; renderAiStep();
  });
}

// відкрити модалку AI-помічника. при відкритті скидаємо стан до першого кроку
function openAi() {
  document.getElementById('aiModal')?.classList.add('open');
  document.getElementById('aiOverlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
  aiState.step = 0; aiState.answers = {};
  renderAiStep();
}
function closeAi() {
  document.getElementById('aiModal')?.classList.remove('open');
  document.getElementById('aiOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}
document.getElementById('aiBtn')?.addEventListener('click', openAi);
document.getElementById('aiClose')?.addEventListener('click', closeAi);
document.getElementById('aiOverlay')?.addEventListener('click', closeAi);

// підвантажує бейджі наявності з бекенду одним батч-запитом (1 fetch замість N).
// сервер повертає обʼєкт {id: qty}. далі для кожного товару дивимось:
// qty=0 — "Немає", qty<5 — "Мало" (попередження дефіциту), інакше "В наявності".
// якщо сервер не запущений (статичний хостинг) — мовчки ігноруємо помилку через .catch
function loadStockBadges(ids) {
  if (!ids.length) return;
  const qs = ids.map(encodeURIComponent).join(',');
  fetch('/api/stock/batch?skus=' + qs)
    .then(r => r.ok ? r.json() : {})
    .then(data => {
      Object.entries(data).forEach(([id, qty]) => {
        const el = document.getElementById('stock-' + id);
        if (!el) return;
        if (qty === 0)     { el.className = 'stock-badge stock-out'; el.textContent = 'Немає'; }
        else if (qty < 5)  { el.className = 'stock-badge stock-low'; el.textContent = 'Мало'; }
        else               { el.className = 'stock-badge stock-in';  el.textContent = 'В наявності'; }
      });
    })
    .catch(() => {});
}

// детальні описи для конкретних топ-товарів (показуються у модалці).
// решта товарів отримує згенерований опис через generateProductDesc()
const productDescriptions = {
  'bauer-supreme-mach':   'Флагман Bauer. Curv Composite конструкція, Carbon Curv Shell. Thermoformable boot + Form-fit X orthopedic insert. Вибір Коннора МакДевіда та еліти NHL.',
  'bauer-vapor-x4':       'Vapor X4 для швидкісних гравців. Asymmetric Curv boot, Quarter Package для вузького профілю. Monoframe Curv Composite — жорсткість без компромісів.',
  'bauer-vapor-3x':       'Vapor 3X — точне відчуття льоду для intermediate-рівня. Quarter package з Curv Composite, Pro-Blade ¼" steel. Ідеал для тих, хто росте як гравець.',
  'bauer-pro-goal':       'Pro Goalie Skates — максимальна жорсткість для воротарів. True Composite boot, широка стійкість, SpeedPlate Custom orthotic.',
  'bauer-supreme-flylite':'Vapor Flylite Stick — ultra-light constriction, kick point налаштований під швидкий постріл. Один з найлегших в каталозі Bauer.',
  'bauer-hyp2':           'Vapor Hyperlite 2 — наступний рівень після Flylite. TeXtreme + Nano Carbon layering, мінімальна вага, максимальна точність.',
  'ccm-ribcor':           'Ribcor 100K Pro — флагман CCM для гравців з прямим катанням. Custom Fit technology, XS Pro Carbon holder, SpeedBlade HD steel.',
  'ccm-tacks-as550':      'Tacks AS 550 — AS-лінія для потужних гравців. Reinforced ankle/boot area. Відмінний перехід від початківця до серйозного рівня.',
  'ccm-tacks-xfp':        'Tacks XF Pro — найпотужніший ковзан серії Tacks. Dual-Density ankle pads, Speed Core Stiffener, SpeedBlade XS holder.',
  'ccm-ft7':              'Jetspeed FT7 Pro — швидкість і точність передачі. TeXtreme carbon shaft, kick point для hard shooters. Elite pick у NHL.',
  'ccm-ft8':              'Jetspeed FT8 Pro — оновлена геометрія леза для контролю шайби. Nano-Carbon reinforcement, 3K woven carbon, покращена балістика пострілу.',
  'true-catalyst':        'True Catalyst 9X4 — Custom Factory 3D fit прямо з фабрики. SL28 Carbon Composite, один з найлегших ковзанів у своєму класі.',
  'true-cat-goal':        'Catalyst Goalie — той самий factory custom fit але для воротарів. True Composite shell, широкий профіль, зносостійкий Speedblade.',
  'graf-g9035':           'Graf Ultra G9035 — швейцарська ручна робота з 1921 року. Натуральна шкіра, класичний профіль, для гравців які цінують традицію.',
  'warrior-covert':       'Warrior Covert QRE 20 Pro — агресивний дизайн, максимальна швидкість передпліч. Carbon Composite reinforced, mid-kick point.',
  'sw-rekker-m90':        'Sher-Wood Rekker M90 — карбонове волокно, унікальний баланс, культова класика Sher-Wood. Вибір для тих, хто любить традиції.',
};

// генерує описовий текст для товару на основі його категорії та бренду.
// потрібен як fallback коли немає індивідуального опису у productDescriptions
function generateProductDesc(p) {
  const map = {
    skates:      `Преміум хокейні ковзани ${p.brand}. Інженерна точність для льодового майданчика. Обирайте розмір та замовляйте.`,
    sticks:      `Хокейна ключка ${p.brand} — карбонова конструкція для точного пострілу та впевненого контролю шайби.`,
    helmets:     `Захисний шолом ${p.brand} — сертифікований захист голови для ігрових навантажень. Комфорт і безпека.`,
    gloves:      `Хокейні рукавиці ${p.brand} — преміум захист зап'ясть, відмінна мобільність для точних передач.`,
    pads:        `Захисне спорядження ${p.brand} — надійний захист для активної гри на льоду. Легке і ергономічне.`,
    bags:        `Хокейна сумка ${p.brand} — зручний та місткий спосіб транспортування всього необхідного спорядження.`,
    accessories: `Хокейний аксесуар ${p.brand} — якість і функціональність для покращення вашої гри.`,
  };
  return map[p.category] || `Преміум хокейна екіпіровка ${p.brand} — для тих, хто не йде на компроміс.`;
}

// відкриває модалку з деталями товару: велике фото, опис, вибір розміру, наявність, кнопка купити.
// підвантажує наявність з бекенду асинхронно — модалка зʼявляється одразу, бейдж потім
function openProductModal(productId) {
  const p = products.find(pr => pr.id === productId);
  if (!p) return;
  const overlay = document.getElementById('pmodalOverlay');
  const modal   = document.getElementById('pmodal');
  const inner   = document.getElementById('pmodalInner');
  if (!overlay || !modal || !inner) return;

  const desc = p.desc || productDescriptions[productId] || generateProductDesc(p);
  let selectedSize = p.sizes[0] || '';

  inner.innerHTML = `
    <div class="pmodal-img-col">
      ${p.img
        ? `<img src="${p.img}" alt="${p.imgDesc}" />`
        : `<div class="pmodal-img-ph">${p.imgDesc}</div>`}
    </div>
    <div class="pmodal-info-col">
      <div class="pmodal-header">
        <span class="pmodal-brand">${p.brand}</span>
        ${p.badge ? `<span class="pmodal-badge-tag">${p.badge}</span>` : ''}
      </div>
      <h2 class="pmodal-name">${p.name}</h2>
      <div class="pmodal-price">${p.formatPrice()}</div>
      <p class="pmodal-desc">${desc}</p>
      <div>
        <div class="pmodal-section-label">Розмір</div>
        <div class="pmodal-sizes">
          ${p.sizes.map(s => `<button class="pmodal-size-chip${s === selectedSize ? ' selected' : ''}" data-size="${s}">${s}</button>`).join('')}
        </div>
      </div>
      <div class="pmodal-stock in" id="pmodalStock">В наявності</div>
      <button class="pmodal-add-btn" id="pmodalAddBtn" data-product-id="${p.id}">Додати в кошик</button>
    </div>
  `;

  // вибір розміру: знімаємо selected з усіх чіпсів, ставимо на натиснутий, запамʼятовуємо
  inner.querySelectorAll('.pmodal-size-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      inner.querySelectorAll('.pmodal-size-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      selectedSize = chip.dataset.size;
    });
  });

  // кнопка "купити" з модалки. без prompt(), бо розмір уже вибраний у чіпсі вище
  inner.querySelector('#pmodalAddBtn').addEventListener('click', () => {
    const product = products.find(pr => pr.id === productId);
    if (!product) return;
    const existing = cart.find(i => i.id === productId);
    if (existing) { existing.qty++; }
    else { cart.push({ id: product.id, name: product.name, brand: product.brand, price: product.price, qty: 1, size: selectedSize }); }
    saveCart(); updateCartUI();
    closeProductModal();
    openCart();
  });

  // підвантажуємо точну кількість на складі для цього товару (одиничний запит)
  fetch('/api/stock/' + encodeURIComponent(productId))
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      const el = document.getElementById('pmodalStock');
      if (!data || !el) return;
      if (data.qty === 0)       { el.className = 'pmodal-stock out'; el.textContent = 'Немає в наявності'; }
      else if (data.qty < 5)    { el.className = 'pmodal-stock low'; el.textContent = `Мало — ${data.qty} шт.`; }
      else                      { el.className = 'pmodal-stock in';  el.textContent = 'В наявності'; }
    })
    .catch(() => {});

  overlay.classList.add('open');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  document.getElementById('pmodalOverlay')?.classList.remove('open');
  document.getElementById('pmodal')?.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('pmodalClose')?.addEventListener('click', closeProductModal);
document.getElementById('pmodalOverlay')?.addEventListener('click', closeProductModal);

// формує блок зі змістом замовлення у вікні оформлення:
// список товарів з розмірами і кількістю + загальна сума
function renderCheckoutSummary() {
  const box = document.getElementById('checkoutSummary');
  if (!box) return;
  if (cart.length === 0) {
    box.innerHTML = '<p class="checkout-empty">Кошик порожній — додай товари перед оформленням.</p>';
    return;
  }
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  box.innerHTML = `
    <div class="checkout-summary-title">Ваше замовлення (${cart.length})</div>
    <ul class="checkout-list">
      ${cart.map(i => `<li><span>${i.brand} ${i.name} <em>${i.size}</em> × ${i.qty}</span><b>${(i.price*i.qty).toLocaleString('uk-UA')} ₴</b></li>`).join('')}
    </ul>
    <div class="checkout-total"><span>Разом:</span><b>${total.toLocaleString('uk-UA')} ₴</b></div>
  `;
}

// відкриває вікно оформлення замовлення. кошик закриваємо щоб не мати дві відкриті панелі одразу.
// якщо кошик пустий — блокуємо submit-кнопку
function openCheckout() {
  closeCart();
  document.getElementById('checkoutModal')?.classList.add('open');
  document.getElementById('checkoutOverlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
  renderCheckoutSummary();
  const submitBtn = document.querySelector('#checkoutForm .checkout-submit');
  if (submitBtn) submitBtn.disabled = cart.length === 0;
}

function closeCheckout() {
  document.getElementById('checkoutModal')?.classList.remove('open');
  document.getElementById('checkoutOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('cartCheckoutBtn')?.addEventListener('click', openCheckout);
document.getElementById('checkoutClose')?.addEventListener('click', closeCheckout);
document.getElementById('checkoutOverlay')?.addEventListener('click', closeCheckout);

const checkoutForm = document.getElementById('checkoutForm');
if (checkoutForm) {
  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const note = document.getElementById('checkoutNote');
    const submitBtn = checkoutForm.querySelector('.checkout-submit');
    const email = (new FormData(checkoutForm).get('email') || '').toString().trim();

    // дві базові перевірки перед відправкою: кошик не пустий і email валідний
    if (cart.length === 0) { note.textContent = 'Кошик порожній.'; note.classList.add('warn'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { note.textContent = 'Невірний email.'; note.classList.add('warn'); return; }

    note.textContent = 'Надсилаємо…';
    note.classList.remove('ok', 'warn');
    submitBtn.disabled = true;

    // готуємо список товарів і відправляємо через Web3Forms (зовнішня служба).
    // це сторонній сервіс який пересилає форми на email власника api-ключа.
    // для дипломної демонстрації — імітація відправки замовлення без власного сервера
    try {
      const lines = cart.map(i => `${i.brand} ${i.name} ×${i.qty}`).join('\n');
      const r = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: '9f196991-7ce7-49ea-a397-ad2eb9b111dd',
          from_name: 'ICEVAULT',
          email,
          subject: 'ICEVAULT — тестовий лист',
          message: `Це тестовий лист від ICEVAULT.\n\nТвоє замовлення:\n${lines}\n\n— Команда ICEVAULT`,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) throw new Error(d.message || ('HTTP ' + r.status));
      note.innerHTML = `Тестовий лист надіслано на <b>${email}</b>.`;
      note.classList.add('ok');
      // очищаємо кошик після успішного "оформлення"
      cart = []; saveCart(); updateCartUI();
      setTimeout(() => {
        closeCheckout(); checkoutForm.reset();
        note.textContent = ''; note.classList.remove('ok');
        submitBtn.disabled = false;
      }, 4000);
    } catch (err) {
      note.textContent = 'Помилка: ' + err.message;
      note.classList.add('warn');
      submitBtn.disabled = false;
    }
  });
}

// фіксуємо перегляд сторінки на бекенді (для статистики у адмін-панелі).
// мовчки ігноруємо помилку якщо сервер не запущений
fetch('/api/pageview', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ path: location.pathname }),
}).catch(() => {});

// функція пошуку замовлення за ID. винесена у window щоб можна було викликати з консолі або з іншого скрипта
window.trackOrder = async function (id) {
  if (!id) return null;
  try {
    const r = await fetch('/api/orders/' + encodeURIComponent(id));
    return r.ok ? r.json() : null;
  } catch { return null; }
};

// IIFE — самовикликна функція. секція "Перевірити статус замовлення" на сторінці.
// користувач вводить ID типу IV-XXXXXXXX, ми робимо запит на бекенд і показуємо статус.
// якщо у localStorage збережений останній ID — підставляємо його у поле
(function initOrderTracker() {
  const btn = document.getElementById('trackOrderBtn');
  const inp = document.getElementById('trackOrderInput');
  const out = document.getElementById('trackOrderResult');
  if (!btn || !inp || !out) return;
  const last = localStorage.getItem('iv_last_order');
  if (last) inp.value = last;
  btn.addEventListener('click', async () => {
    const id = inp.value.trim();
    if (!id) { out.textContent = 'Введи ID замовлення'; return; }
    out.textContent = 'Шукаємо…';
    const r = await window.trackOrder(id);
    if (!r) { out.textContent = 'Замовлення не знайдено'; return; }
    const map = { new: 'Новий', processing: 'Обробляється', shipped: 'Відправлено', delivered: 'Доставлено', cancelled: 'Скасовано' };
    out.innerHTML = `<b>${r.id}</b> — <span style="color:#10b981">${map[r.status] || r.status}</span> • ${r.total.toLocaleString('uk-UA')} ₴ • ${r.city}`;
  });
})();
