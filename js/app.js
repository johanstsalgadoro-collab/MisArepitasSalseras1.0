/* Catálogo público de Mis Arepitas Salseras. Los precios se leen de data/menu.json. */
(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const money = (value) => '$' + Math.round(Number(value) || 0).toLocaleString('es-CO');
  const clean = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
  const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (letter) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[letter]));
  const storageKey = 'mis-arepitas-salseras-pedido-v1';
  const state = {products: [], categories: [], category:'all', term:'', cart:{}, lastFocus:null};

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      Object.entries(saved).forEach(([id, qty]) => {
        if (/^[a-z0-9-]{1,90}$/i.test(id) && Number.isInteger(qty) && qty > 0 && qty <= 99) state.cart[id] = qty;
      });
    }
  } catch (_) { /* El almacenamiento puede estar bloqueado. */ }

  function persistCart() {
    try { localStorage.setItem(storageKey, JSON.stringify(state.cart)); } catch (_) { /* El pedido sigue funcionando durante esta visita. */ }
  }

  function openCart() {
    state.lastFocus = document.activeElement;
    $('#cart-overlay').hidden = false;
    $('#cart-panel').classList.add('is-open');
    $('#cart-panel').setAttribute('aria-hidden','false');
    document.body.classList.add('locked');
    $('#cart-close').focus();
  }

  function closeCart() {
    $('#cart-panel').classList.remove('is-open');
    $('#cart-panel').setAttribute('aria-hidden','true');
    $('#cart-overlay').hidden = true;
    document.body.classList.remove('locked');
    state.lastFocus?.focus?.();
  }

  function updateCart() {
    const lookup = new Map(state.products.map(p => [p.id,p]));
    for (const [id,qty] of Object.entries(state.cart)) {
      if (!lookup.has(id) || !lookup.get(id).active || qty <= 0) delete state.cart[id];
    }
    const items = Object.entries(state.cart).map(([id,qty]) => ({...lookup.get(id),qty}));
    const count = items.reduce((total,item) => total + item.qty,0);
    const total = items.reduce((sum,item) => sum + item.price * item.qty,0);
    $('#cart-count').textContent = count;
    $('#cart-count').hidden = count === 0;
    $('#floating-count').textContent = count;
    $('#floating-cart').classList.toggle('has-items',count > 0);
    $('#cart-total').textContent = money(total);
    $('#cart-items').innerHTML = items.length ? items.map(item => `
      <div class="cart-item"><div><h3>${safe(item.name)}</h3><small>${money(item.price)} por unidad</small>
      <div class="qty-control"><button type="button" data-qty="-1" data-id="${safe(item.id)}" aria-label="Quitar una unidad de ${safe(item.name)}">−</button><span>${item.qty}</span><button type="button" data-qty="1" data-id="${safe(item.id)}" aria-label="Agregar una unidad de ${safe(item.name)}">+</button></div></div><strong class="cart-price">${money(item.price * item.qty)}</strong></div>`).join('') : `
      <div class="cart-empty"><svg class="line-icon" aria-hidden="true"><use href="#i-bag"/></svg><strong>Tu pedido está vacío</strong><p>Explora la carta y agrega las arepas que te hagan agua la boca.</p></div>`;
    const phone = $('#cart-phone').value;
    const lines = ['¡Hola, Mis Arepitas Salseras! Quisiera hacer este pedido:', ''];
    items.forEach(item => lines.push(`${item.qty} × ${item.name} — ${money(item.price * item.qty)}`));
    lines.push('',`Subtotal de productos: ${money(total)}`);
    const note = $('#cart-note').value.trim();
    if (note) lines.push('',`Indicaciones: ${note}`);
    lines.push('','¿Me confirman disponibilidad, sede y costo de domicilio, si aplica?');
    $('#cart-checkout').href = `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`;
    $('#cart-checkout').classList.toggle('is-disabled',items.length === 0);
    $('#cart-checkout').setAttribute('aria-disabled',String(items.length === 0));
    persistCart();
  }

  function addItem(id) {
    const product = state.products.find(item => item.id === id && item.active);
    if (!product) return;
    state.cart[id] = Math.min(99,(state.cart[id] || 0) + 1);
    updateCart();
    const button = document.querySelector(`[data-add="${CSS.escape(id)}"]`);
    if (button) {
      button.classList.add('added');
      button.querySelector('.add-label').textContent = 'Agregado';
      window.setTimeout(() => { if (button.isConnected) {button.classList.remove('added');button.querySelector('.add-label').textContent='Agregar';} },900);
    }
  }

  function renderFilters() {
    $('#menu-filters').innerHTML = [`<button type="button" class="filter-pill is-active" data-category="all" aria-pressed="true">Todo el menú</button>`,
      ...state.categories.map(category => `<button type="button" class="filter-pill" data-category="${safe(category.id)}" aria-pressed="false">${safe(category.short || category.label)}</button>`)].join('');
  }

  function renderMenu() {
    const matches = state.products.filter(item => item.active && (state.category === 'all' || item.category === state.category) &&
      (!state.term || clean([item.name,item.description,item.category].join(' ')).includes(clean(state.term))));
    const labels = new Map(state.categories.map(category => [category.id,category.short || category.label]));
    $('#menu-grid').innerHTML = matches.map(item => `<article class="product-card" id="product-${safe(item.id)}">
      <div class="product-top"><span class="product-category">${safe(labels.get(item.category) || 'Arepas')}</span>${item.featured ? '<span class="product-tag">Recomendada</span>':''}</div>
      <h3>${safe(item.name)}</h3><p>${safe(item.description)}</p><div class="product-bottom"><span class="product-price">${money(item.price)}</span><button type="button" class="add-button" data-add="${safe(item.id)}" aria-label="Agregar ${safe(item.name)} a mi pedido"><svg class="line-icon" aria-hidden="true"><use href="#i-plus"/></svg><span class="add-label">Agregar</span></button></div></article>`).join('');
    $('#menu-results').textContent = `${matches.length} ${matches.length === 1 ? 'producto disponible':'productos disponibles'}`;
    $('#menu-empty').hidden = matches.length > 0;
    document.querySelectorAll('.filter-pill').forEach(button => {
      const active = button.dataset.category === state.category;
      button.classList.toggle('is-active',active);
      button.setAttribute('aria-pressed',String(active));
    });
  }

  async function loadMenu() {
    try {
      const response = await fetch('data/menu.json', {cache:'no-store'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data.products) || !Array.isArray(data.categories)) throw new Error('Formato de menú inválido');
      state.products = data.products.filter(item => item && typeof item.id === 'string' && Number.isFinite(Number(item.price))).map(item => ({...item,price:Number(item.price),active:item.active !== false}));
      state.categories = data.categories;
      renderFilters();renderMenu();updateCart();
    } catch (error) {
      console.error('No se pudo cargar el catálogo:',error);
      $('#menu-results').textContent = 'No pudimos cargar la carta en este momento.';
      $('#menu-grid').innerHTML = '<div class="menu-empty" style="grid-column:1/-1"><h3>Carta no disponible</h3><p>Inténtalo de nuevo más tarde. Si abriste el archivo directamente, usa un servidor local o GitHub Pages.</p></div>';
      $('#menu-filters').hidden = true;
    }
  }

  function setupInteractions() {
    $('#year').textContent = new Date().getFullYear();
    $('#nav-toggle').addEventListener('click', () => {
      const open = $('#nav-links').classList.toggle('is-open');
      $('#nav-toggle').setAttribute('aria-expanded',String(open));
      $('#nav-toggle').setAttribute('aria-label',open ? 'Cerrar menú':'Abrir menú');
    });
    document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', () => {
      $('#nav-links').classList.remove('is-open');$('#nav-toggle').setAttribute('aria-expanded','false');
    }));
    $('#menu-filters').addEventListener('click', event => {
      const button = event.target.closest('[data-category]');if (!button)return;
      state.category = button.dataset.category;renderMenu();
    });
    $('#menu-search').addEventListener('input',event => {state.term = event.target.value.trim();renderMenu();});
    $('#clear-filters').addEventListener('click',() => {state.category='all';state.term='';$('#menu-search').value='';renderMenu();});
    $('#menu-grid').addEventListener('click',event => {const button=event.target.closest('[data-add]');if(button)addItem(button.dataset.add);});
    document.querySelectorAll('[data-focus-product]').forEach(button => button.addEventListener('click', () => {
      state.category='all';state.term='';$('#menu-search').value='';renderMenu();
      const el = document.getElementById('product-' + button.dataset.focusProduct);
      if (el){el.scrollIntoView({behavior:'smooth',block:'center'});el.animate([{boxShadow:'0 0 0 0 #f47a3988'},{boxShadow:'0 0 0 12px #f47a3900'}],{duration:1300});}
    }));
    ['#nav-order','#floating-cart'].forEach(selector => $(selector).addEventListener('click',openCart));
    $('#cart-close').addEventListener('click',closeCart);$('#cart-overlay').addEventListener('click',closeCart);
    $('#cart-items').addEventListener('click',event => {
      const button=event.target.closest('[data-qty]');if(!button)return;
      const id=button.dataset.id;
      state.cart[id]=(state.cart[id] || 0)+Number(button.dataset.qty);
      if (state.cart[id]<=0) delete state.cart[id];
      if (state.cart[id]>99)state.cart[id]=99;
      updateCart();
    });
    $('#cart-phone').addEventListener('change',updateCart);$('#cart-note').addEventListener('input',updateCart);
    $('#cart-checkout').addEventListener('click',event => {
      if ($('#cart-checkout').classList.contains('is-disabled')) event.preventDefault();
    });
    document.addEventListener('keydown',event => {
      if (event.key==='Escape' && $('#cart-panel').classList.contains('is-open')) closeCart();
      if (event.key==='Tab' && $('#cart-panel').classList.contains('is-open')) {
        const controls=[...$('#cart-panel').querySelectorAll('button:not(:disabled),a[href],select,textarea')];
        const first=controls[0],last=controls[controls.length-1];
        if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
      }
    });
    if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const observer=new IntersectionObserver(entries => entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.10,rootMargin:'0px 0px -30px 0px'});
      document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
    } else document.querySelectorAll('.reveal').forEach(el=>el.classList.add('is-visible'));
    window.addEventListener('pageshow',() => {if (state.products.length)loadMenu();});
  }

  setupInteractions();loadMenu();
})();
