/* ═══════════════════════════════════════════════════════
   ICEVAULT — MAIN SCRIPT
   Covers: Objects, Arrays, Loops, BOM, DOM,
           setInterval/setTimeout, location.href,
           Event Handlers, Form Validation,
           Scroll Animations, Cart, Clock
═══════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────
   1. ВЛАСНИЙ ОБ'ЄКТ — Product
───────────────────────────────────────── */
class Product {
  constructor({ id, name, brand, category, price, badge, imgDesc }) {
    this.id       = id;
    this.name     = name;
    this.brand    = brand;
    this.category = category;
    this.price    = price;
    this.badge    = badge || null;
    this.imgDesc  = imgDesc;
  }
  formatPrice() {
    return this.price.toLocaleString('uk-UA') + ' ₴';
  }
  getLabel() {
    return `${this.brand} ${this.name}`;
  }
}

/* ─────────────────────────────────────────
   2. МАСИВ ПРОДУКТІВ (тільки преміум)
───────────────────────────────────────── */
const products = [
  new Product({ id:'bauer-mach',      name:'Supreme Mach Skates',    brand:'Bauer',      category:'skates',  price:38500, badge:'TOP PRO', imgDesc:'Bauer Supreme Mach — чорно-золоті ковзани, вид ¾, темний фон' }),
  new Product({ id:'bauer-hyp2',      name:'Vapor Hyperlite 2 Stick', brand:'Bauer',      category:'sticks',  price:15200, badge:'NEW',     imgDesc:'Bauer Vapor Hyperlite 2 — вуглецева ключка, вертикально' }),
  new Product({ id:'bauer-reakt',     name:'RE-AKT 200 PRO Helmet',   brand:'Bauer',      category:'helmets', price:8500,  badge:null,     imgDesc:'Bauer RE-AKT 200 PRO — чорний шолом з решіткою, бічний вид' }),
  new Product({ id:'bauer-gloves',    name:'Vapor 3X Pro Gloves',     brand:'Bauer',      category:'gloves',  price:9200,  badge:null,     imgDesc:'Bauer Vapor 3X Pro — пара рукавиць, чорно-білі, студіо' }),
  new Product({ id:'ccm-ribcor',      name:'Ribcor 100K Pro Skates',  brand:'CCM',        category:'skates',  price:32000, badge:'PRO',    imgDesc:'CCM Ribcor 100K Pro — чорно-червоні ковзани, пара зверху' }),
  new Product({ id:'ccm-ft7',         name:'Jetspeed FT7 Pro Stick',  brand:'CCM',        category:'sticks',  price:14500, badge:'NEW',    imgDesc:'CCM Jetspeed FT7 Pro — чорна ключка, прямий вид' }),
  new Product({ id:'ccm-tacks',       name:'Tacks 720 Pro Helmet',    brand:'CCM',        category:'helmets', price:7800,  badge:null,     imgDesc:'CCM Tacks 720 Pro — антрацитовий шолом, фронтальний вид' }),
  new Product({ id:'reebok-11k',      name:'11K Pump Pro Skates',     brand:'Reebok',     category:'skates',  price:12800, badge:null,     imgDesc:'Reebok 11K Pump — помаранчево-чорні ковзани' }),
  new Product({ id:'reebok-helm',     name:'11K Pro Helmet',          brand:'Reebok',     category:'helmets', price:5500,  badge:null,     imgDesc:'Reebok 11K — чорно-червоний шолом, бічний вид' }),
  new Product({ id:'graf-ultra',      name:'Ultra G9035 Skates',      brand:'Graf',       category:'skates',  price:28000, badge:'HANDMADE',imgDesc:'Graf Ultra G9035 — бежево-чорні, натуральна шкіра, 45°' }),
  new Product({ id:'true-catalyst',   name:'Catalyst 9X Skates',      brand:'True Hockey',category:'skates',  price:36200, badge:'NEW',    imgDesc:'True Catalyst 9X — чорно-срібні ковзани, динамічний кут' }),
  new Product({ id:'true-ax9',        name:'AX9 Pro Stick',           brand:'True Hockey',category:'sticks',  price:16800, badge:'TOP',    imgDesc:'True AX9 — темна ключка, мінімалізм, вертикально' }),
  new Product({ id:'sw-rekker',       name:'Rekker M90 Stick',        brand:'Sher-Wood',  category:'sticks',  price:11200, badge:null,     imgDesc:'Sher-Wood Rekker M90 — чорно-золота ключка, студіо' }),
  new Product({ id:'sw-pads',         name:'Code I Pro Shoulder Pads',brand:'Sher-Wood',  category:'pads',    price:6900,  badge:null,     imgDesc:'Sher-Wood Code I Pro — чорний нагрудний захист, фронт' }),
  new Product({ id:'warrior-qre',     name:'Covert QRE 20 Pro Stick', brand:'Warrior',    category:'sticks',  price:13500, badge:'PRO',    imgDesc:'Warrior Covert QRE 20 — жовто-чорна ключка, агресивний вид' }),
  new Product({ id:'warrior-gloves',  name:'Alpha DX Pro Gloves',     brand:'Warrior',    category:'gloves',  price:8900,  badge:null,     imgDesc:'Warrior Alpha DX Pro — чорно-жовті рукавиці, пара' }),
];

/* ─────────────────────────────────────────
   3. КОШИК (localStorage + власний об'єкт)
───────────────────────────────────────── */
let cart = JSON.parse(localStorage.getItem('iv_cart') || '[]');

function saveCart() {
  localStorage.setItem('iv_cart', JSON.stringify(cart));
}

function updateCartUI() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const cartCountEl = document.getElementById('cartCount');
  if (cartCountEl) {
    cartCountEl.textContent = count;
    cartCountEl.style.transform = 'scale(1.5)';
    setTimeout(() => { cartCountEl.style.transform = 'scale(1)'; }, 300);
  }

  const totalEl = document.getElementById('cartTotal');
  if (totalEl) totalEl.textContent = total.toLocaleString('uk-UA') + ' ₴';

  const itemsEl = document.getElementById('cartItems');
  if (!itemsEl) return;

  if (cart.length === 0) {
    itemsEl.innerHTML = '<div class="cart-empty">Кошик порожній</div>';
    return;
  }

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

  // Qty buttons
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

  // Remove buttons
  itemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      cart = cart.filter(i => i.id !== btn.dataset.id);
      saveCart();
      updateCartUI();
    });
  });
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  // prompt для вибору розміру (BOM window.prompt)
  const size = prompt(`Оберіть розмір для "${product.getLabel()}":\n(наприклад: 7, 7.5, 8, 8.5, 9, 9.5, S, M, L, XL)`);
  if (size === null) return; // скасовано

  const existing = cart.find(i => i.id === productId);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id: product.id, name: product.name, brand: product.brand, price: product.price, qty: 1, size: size.trim() });
  }
  saveCart();
  updateCartUI();

  // Показати drawer
  openCart();
}

function openCart() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (drawer) drawer.classList.add('open');
  if (overlay) overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// Cart button
const cartBtn = document.getElementById('cartBtn');
if (cartBtn) cartBtn.addEventListener('click', openCart);

const cartClose = document.getElementById('cartClose');
if (cartClose) cartClose.addEventListener('click', closeCart);

const cartOverlay = document.getElementById('cartOverlay');
if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

updateCartUI();

/* ─────────────────────────────────────────
   4. РЕНДЕР КАТАЛОГУ (цикли + умови)
───────────────────────────────────────── */
function renderProducts(filter = 'all') {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  // Фільтрація масиву (умова)
  const filtered = filter === 'all'
    ? products
    : products.filter(p => p.category === filter);

  if (filtered.length === 0) {
    grid.innerHTML = '<p class="no-products">Товарів не знайдено</p>';
    return;
  }

  // Рендер через цикл .map()
  grid.innerHTML = filtered.map((p, i) => `
    <div class="product-card" data-cat="${p.category}" style="--i:${i}">
      <div class="product-img">
        <div class="img-placeholder">
          <div class="ph-label sm">
            <span class="ph-tag">${p.imgDesc}</span>
          </div>
        </div>
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
        <span class="product-price">${p.formatPrice()}</span>
      </div>
    </div>
  `).join('');

  // Hover overlay listeners
  grid.querySelectorAll('.btn-add-full').forEach(btn => {
    btn.addEventListener('click', () => addToCart(btn.dataset.productId));
  });

  // Stagger animation
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

renderProducts();

/* ─────────────────────────────────────────
   5. FILTER BUTTONS (addEventListener)
───────────────────────────────────────── */
const filterRow = document.getElementById('filterRow');
if (filterRow) {
  filterRow.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterRow.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProducts(btn.dataset.filter);
    });
  });
}

// Brand links filter
document.querySelectorAll('[data-filter-brand]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const brand = link.dataset.filterBrand;
    const catalogSection = document.getElementById('catalog');
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        // Знайти фільтр і показати всі цього бренду
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

/* ─────────────────────────────────────────
   6. ADD TO CART (featured collection)
───────────────────────────────────────── */
document.querySelectorAll('.btn-add').forEach(btn => {
  btn.addEventListener('click', () => {
    addToCart(btn.dataset.id);
  });
});

/* ─────────────────────────────────────────
   7. LIVE CLOCK — setInterval
───────────────────────────────────────── */
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

  // Год у навбарі
  const navClock = document.getElementById('navClock');
  if (navClock) navClock.textContent = timeStr;

  // Hero date + time
  const heroDate = document.getElementById('heroDate');
  if (heroDate) heroDate.textContent = dateStr;

  const heroTime = document.getElementById('heroTime');
  if (heroTime) heroTime.textContent = timeStr;

  // Mobile menu date
  const mobileDate = document.getElementById('mobileDate');
  if (mobileDate) mobileDate.textContent = `${dd}.${mo}.${yyyy}`;

  // Footer year
  const footerYear = document.getElementById('footerYear');
  if (footerYear) footerYear.textContent = yyyy;

  // Developer year
  const devYear = document.getElementById('devYear');
  if (devYear) devYear.textContent = yyyy;
}

updateClock();
setInterval(updateClock, 1000);

/* ─────────────────────────────────────────
   8. SESSION TIMER — setInterval
───────────────────────────────────────── */
let sessionSeconds = 0;
const sessionEl = document.getElementById('sessionTimer');

const sessionInterval = setInterval(() => {
  sessionSeconds++;
  const m = String(Math.floor(sessionSeconds / 60)).padStart(2, '0');
  const s = String(sessionSeconds % 60).padStart(2, '0');
  if (sessionEl) sessionEl.textContent = `${m}:${s}`;
}, 1000);

/* ─────────────────────────────────────────
   9. BOM — navigator, alert, confirm
───────────────────────────────────────── */

// Показати браузер у секції розробника
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

// Перше відвідування — alert
if (!localStorage.getItem('iv_visited')) {
  setTimeout(() => {
    alert('Ласкаво просимо до ICEVAULT!\n\nТільки преміум-сегмент хокейного екіпірування.\nПідпишись та отримай знижку 10% на перше замовлення.');
    localStorage.setItem('iv_visited', '1');
  }, 1800);
}

/* ─────────────────────────────────────────
   10. CUSTOM CURSOR
───────────────────────────────────────── */
const cursor = document.getElementById('cursor');
const follower = document.getElementById('cursorFollower');
let mouseX = 0, mouseY = 0, folX = 0, folY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (cursor) { cursor.style.left = mouseX + 'px'; cursor.style.top = mouseY + 'px'; }
});

(function animFol() {
  folX += (mouseX - folX) * 0.11;
  folY += (mouseY - folY) * 0.11;
  if (follower) { follower.style.left = folX + 'px'; follower.style.top = folY + 'px'; }
  requestAnimationFrame(animFol);
})();

document.querySelectorAll('a, button, .product-card, .col-item, .brand-block, .faq-q').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

/* ─────────────────────────────────────────
   11. NAVBAR + SCROLL PROGRESS
───────────────────────────────────────── */
const nav = document.getElementById('nav');
const progressBar = document.getElementById('scrollProgress');

window.addEventListener('scroll', () => {
  // Navbar scrolled state
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);

  // Scroll progress bar
  if (progressBar) {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
    progressBar.style.width = pct + '%';
  }

  // Back-to-top
  const bt = document.getElementById('backTop');
  if (bt) bt.classList.toggle('visible', window.scrollY > 500);
}, { passive: true });

/* ─────────────────────────────────────────
   12. SCROLL ANIMATIONS (clip-reveal + fade-up)
───────────────────────────────────────── */
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

initScrollAnimations();

// Parallax на hero bg
const heroBg = document.querySelector('.hero-bg');
if (heroBg) {
  window.addEventListener('scroll', () => {
    heroBg.style.transform = `translateY(${window.scrollY * 0.32}px)`;
  }, { passive: true });
}

/* ─────────────────────────────────────────
   13. MARQUEE — динамічна швидкість від скролу
───────────────────────────────────────── */
let lastScrollY = 0;
let marqueeSpeed = 22;
const marqueeTrack = document.getElementById('marqueeTrack');

window.addEventListener('scroll', () => {
  const delta = Math.abs(window.scrollY - lastScrollY);
  marqueeSpeed = Math.max(8, 22 - delta * 0.5);
  if (marqueeTrack) {
    marqueeTrack.style.animationDuration = marqueeSpeed + 's';
  }
  lastScrollY = window.scrollY;
}, { passive: true });

/* ─────────────────────────────────────────
   14. COUNT-UP ANIMATION (числа у статистиці)
───────────────────────────────────────── */
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

const countObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      countUp(entry.target);
      countObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.count-up').forEach(el => countObs.observe(el));

/* ─────────────────────────────────────────
   15. MOBILE MENU
───────────────────────────────────────── */
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

/* ─────────────────────────────────────────
   16. BACK TO TOP — location scroll
───────────────────────────────────────── */
const backTop = document.getElementById('backTop');
if (backTop) {
  backTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ─────────────────────────────────────────
   17. SMOOTH ANCHOR SCROLL
───────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

/* ─────────────────────────────────────────
   18. NEWSLETTER FORM (index.html)
───────────────────────────────────────── */
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
    btn.textContent = 'Підписано! ✓';
    btn.disabled = true;
    btn.style.opacity = '0.7';
    input.value = '';
    setTimeout(() => { btn.textContent = 'Підписатися'; btn.disabled = false; btn.style.opacity = ''; }, 4000);
  });
}

/* ─────────────────────────────────────────
   19. CONTACTS FORM VALIDATION
───────────────────────────────────────── */
const contactForm = document.getElementById('contactForm');
if (contactForm) {

  function setError(fieldId, msg) {
    const fg = document.getElementById('fg-' + fieldId);
    const err = document.getElementById('err-' + fieldId);
    if (fg) fg.classList.add('has-error');
    if (err) err.textContent = msg;
  }

  function clearError(fieldId) {
    const fg = document.getElementById('fg-' + fieldId);
    const err = document.getElementById('err-' + fieldId);
    if (fg) fg.classList.remove('has-error');
    if (err) err.textContent = '';
  }

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

  // Real-time validation on blur
  ['cName','cEmail','cPhone','cMsg'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('blur', validateForm);
  });

  // Submit
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');
    const formStatus = document.getElementById('formStatus');

    // Симуляція відправки
    if (submitText) submitText.style.display = 'none';
    if (submitSpinner) submitSpinner.style.display = 'inline-block';
    if (submitBtn) submitBtn.disabled = true;

    setTimeout(() => {
      if (submitText) { submitText.style.display = ''; submitText.textContent = 'Надіслано ✓'; }
      if (submitSpinner) submitSpinner.style.display = 'none';
      if (formStatus) {
        formStatus.textContent = 'Дякуємо! Ваше повідомлення успішно надіслано. Ми зв\'яжемось з вами протягом 24 годин.';
        formStatus.className = 'form-status success';
      }
      contactForm.reset();
      setTimeout(() => {
        if (submitBtn) { submitBtn.disabled = false; }
        if (submitText) submitText.textContent = 'Надіслати';
      }, 4000);
    }, 1500);
  });

  // Reset
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      ['name','email','phone','subject','msg','agree'].forEach(f => clearError(f));
      const formStatus = document.getElementById('formStatus');
      if (formStatus) { formStatus.textContent = ''; formStatus.className = 'form-status'; }
    });
  }
}

/* ─────────────────────────────────────────
   20. FAQ ACCORDION
───────────────────────────────────────── */
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

/* ─────────────────────────────────────────
   21. location.href — Навігація через confirm
───────────────────────────────────────── */
document.querySelectorAll('.cart-checkout').forEach(btn => {
  btn.addEventListener('click', () => {
    if (cart.length === 0) {
      alert('Ваш кошик порожній. Додайте товари перед оформленням.');
      return;
    }
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const ok = confirm(`Підтвердити замовлення на суму ${total.toLocaleString('uk-UA')} ₴?\n\nТовари:\n${cart.map(i => `• ${i.name} × ${i.qty}`).join('\n')}`);
    if (ok) {
      cart = [];
      saveCart();
      updateCartUI();
      closeCart();
      alert('Дякуємо за замовлення!\nМи зв\'яжемося з вами найближчим часом.');
      // location.href для переходу на contacts
      // location.href = 'contacts.html';
    }
  });
});

/* ─────────────────────────────────────────
   22. HOVER TILT effect
───────────────────────────────────────── */
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
