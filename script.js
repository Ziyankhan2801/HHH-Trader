// Responsive + contact form + product WhatsApp + basic cart (localStorage)
// Number used: 9021278856 -> international in links: 919021278856

document.addEventListener('DOMContentLoaded', () => {
  // set year if present
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  initHamburger();
  initProductWAButtons();
  initContactForm();
  initAddButtons();
  initCartDisplay();
  initSearchFilters();
  initRevealObserver();
  initNavLinkCloseOnClick();
});

/* HAMBURGER */
function initHamburger(){
  const burger = document.getElementById('hamburger');
  const nav = document.getElementById('mainnav');
  if(!burger || !nav) return;
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    // prevent background scroll when menu open on very small devices
    if(open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
  });
}

/* Close mobile nav when a link is clicked (mobile UX) */
function initNavLinkCloseOnClick(){
  const nav = document.getElementById('mainnav');
  if(!nav) return;
  nav.addEventListener('click', (e) => {
    const target = e.target;
    if(target.tagName === 'A' && nav.classList.contains('open')) {
      nav.classList.remove('open');
      document.getElementById('hamburger')?.setAttribute('aria-expanded','false');
      document.body.style.overflow = '';
    }
  });
}

/* REVEAL: IntersectionObserver for smooth animated entrance */
function initRevealObserver(){
  const targets = Array.from(document.querySelectorAll('.reveal'));
  if(!targets.length) return;
  const obs = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(t => obs.observe(t));
}

/* Make every product WA button open WhatsApp with image + sentence */
function initProductWAButtons(){
  const waBtns = document.querySelectorAll('.wa-product');
  waBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const phone = btn.dataset.phone || '919021278856';
      const img = btn.dataset.img || '';
      const card = btn.closest('.card');
      const title = (card?.querySelector('h3')?.innerText || card?.dataset?.title || '').trim();
      // message: a short sentence + image link
      const sentence = `Hello! I'm interested in this product: ${title}. Please share price & availability.`;
      // include image URL on new line so WhatsApp shows it as text link (hosting recommended)
      const full = sentence + (img ? `\nImage: ${img}` : '');
      const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(full)}`;
      window.open(url, '_blank');
    });
  });
}

/* CONTACT form -> WhatsApp */
function initContactForm(){
  const contactBtn = document.getElementById('contact-whatsapp');
  if(!contactBtn) return;
  contactBtn.addEventListener('click', () => {
    const name = document.getElementById('cf-name').value.trim() || 'Anonymous';
    const phoneUser = document.getElementById('cf-phone').value.trim() || '';
    const email = document.getElementById('cf-email').value.trim() || '';
    const message = document.getElementById('cf-message').value.trim();
    if(!message){ alert('Please write your message (what item / qty / city).'); return; }
    const shopPhone = '919021278856';
    let text = `New enquiry from ${name}\n`;
    if(phoneUser) text += `Phone: ${phoneUser}\n`;
    if(email) text += `Email: ${email}\n`;
    text += `Message: ${message}`;
    const url = `https://api.whatsapp.com/send?phone=${shopPhone}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  });
}

/* Add-to-cart simple demo (increments counter, stores basic cart) */
function initAddButtons(){
  const addBtns = document.querySelectorAll('.card .add');
  addBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = btn.closest('.card');
      const id = card.dataset.id || (card.querySelector('h3')?.innerText || ('item-' + Date.now()));
      const title = card.dataset.title || (card.querySelector('h3')?.innerText || 'Item');
      const price = Number(card.dataset.price || 0);
      addToCart({id, title, price, qty:1});
      animateBtn(btn);
    });
  });
}

/* Simple localStorage cart (only count & basic items) */
const CART_KEY = 'hhh_cart_simple';
function getCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }catch(e){ return []; } }
function saveCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); renderCartCount(); }
function addToCart(item){
  const cart = getCart();
  const found = cart.find(i => i.id === item.id);
  if(found) found.qty += item.qty; else cart.push(item);
  saveCart(cart);
}
function renderCartCount(){
  const countEl = document.getElementById('cart-count');
  if(!countEl) return;
  const count = getCart().reduce((s,i)=>s+i.qty,0);
  countEl.textContent = count;
}
function initCartDisplay(){ renderCartCount(); }

/* small btn animation */
function animateBtn(btn){
  try{ btn.animate([{transform:'scale(1)'},{transform:'scale(1.06)'},{transform:'scale(1)'}], {duration:250}); }catch(e){}
}

/* Search / filter / sort */
function initSearchFilters(){
  const search = document.getElementById('search');
  const cat = document.getElementById('cat');
  const sort = document.getElementById('sort');

  [search, cat, sort].forEach(el => {
    if(!el) return;
    el.addEventListener('input', apply);
    el.addEventListener('change', apply);
  });

  function apply(){
    const q = (search?.value || '').toLowerCase();
    const c = (cat?.value || 'all');
    const s = (sort?.value || 'featured');
    const cards = document.querySelectorAll('.masonry .card');
    cards.forEach(card => {
      const title = (card.dataset.title || card.querySelector('h3')?.innerText || '').toLowerCase();
      const category = (card.dataset.cat || '').toLowerCase();
      const matchQ = !q || title.includes(q);
      const matchC = c === 'all' ? true : (category === c);
      card.style.display = (matchQ && matchC) ? '' : 'none';
    });
    if(s !== 'featured'){
      const grid = document.getElementById('masonry');
      const visible = Array.from(grid.querySelectorAll('.card')).filter(c => c.style.display !== 'none');
      visible.sort((a,b) => s === 'low' ? a.dataset.price - b.dataset.price : b.dataset.price - a.dataset.price);
      visible.forEach(c => grid.appendChild(c));
    }
  }
}
