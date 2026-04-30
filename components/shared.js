/* ═══════════════════════════════════════════════════════════════
   shared.js — kshiiteej JS utilities
   v1.0 · April 2026
   Save to: C:\Users\ajink\kshiiteej\components\shared.js
   ═══════════════════════════════════════════════════════════════

   HOW TO USE PER PAGE
   ───────────────────
   1. Load this file at bottom of <body>:
      <script src="components/shared.js"></script>

   2. After it, add a small page <script> that calls
      only what that page needs:

      index.html / home.html:
        initReveal();
        initScrollSentences();
        initCarousel('.carousel-slide', '.carr-dot', 'cur');

      dagad.html:
        initReveal();
        initCarousel('.carousel-slide', '.carr-dot', 'dagadCur');
        initImpactCounters();

      kshiiteej.html:
        initReveal();
        initCarousel('.carousel-slide', '.carr-dot', 'kshCur');

      contact.html:
        initReveal();

   ═══════════════════════════════════════════════════════════════ */


/* ── SCROLL REVEAL ───────────────────────────────────────────── */
/*
   Watches all .reveal elements.
   Adds .visible when they enter the viewport.
   Supports .d2 .d3 .d4 delay classes via shared.css.
*/

function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}


/* ── CAROUSEL ────────────────────────────────────────────────── */
/*
   Generic carousel — works for any page.
   Each page passes its own slide + dot selectors
   and a unique state variable name to avoid conflicts
   when multiple carousels exist on one page (future-proof).

   Usage:
     const ctrl = initCarousel('.carousel-slide', '.carr-dot');
     // returns { goTo } so page buttons can call ctrl.goTo(n)

   Auto-advances every 4s. Resets timer on manual nav.
*/

function initCarousel(slideSelector, dotSelector, intervalMs) {
  intervalMs = intervalMs || 4000;

  const slides = document.querySelectorAll(slideSelector);
  const dots   = document.querySelectorAll(dotSelector);

  if (!slides.length) return null;

  let cur   = 0;
  let timer = null;

  function goTo(n) {
    slides[cur].classList.remove('active');
    if (dots[cur]) dots[cur].classList.remove('active');

    cur = ((n % slides.length) + slides.length) % slides.length;

    slides[cur].classList.add('active');
    if (dots[cur]) dots[cur].classList.add('active');

    clearInterval(timer);
    timer = setInterval(() => goTo(cur + 1), intervalMs);
  }

  /* start auto-advance */
  timer = setInterval(() => goTo(cur + 1), intervalMs);

  /* return controller so page buttons can drive it */
  return { goTo, get cur() { return cur; } };
}


/* ── SCROLL SENTENCES ────────────────────────────────────────── */
/*
   Ebbs pattern 01.
   Each .scroll-sentence-text fades in when its parent
   .scroll-sentence enters the viewport, and fades out
   when it leaves. One sentence visible at a time.

   HTML pattern expected:
   <section class="scroll-sentence">
     <p class="scroll-sentence-text">no two the same.</p>
   </section>
*/

function initScrollSentences() {
  const sentences = document.querySelectorAll('.scroll-sentence-text');
  if (!sentences.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
      } else {
        e.target.classList.remove('visible');
      }
    });
  }, {
    threshold: 0.4,
    rootMargin: '-10% 0px -10% 0px'        /* sentence shows when 50% in view */
  });

  sentences.forEach(el => obs.observe(el));
}


/* ── IMPACT COUNTERS ─────────────────────────────────────────── */
/*
   Animates numbers from 0 → data-target on scroll into view.
   Uses ease-out cubic for natural deceleration.
   Only fires once per element.

   HTML pattern expected:
   <div class="impact-num" data-target="7500">—</div>

   Special case: data-target="∞" skips animation, stays ∞.
*/

function initImpactCounters() {
  const counters = document.querySelectorAll('.impact-num[data-target]');
  if (!counters.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      obs.unobserve(e.target);

      const el     = e.target;
      const raw    = el.dataset.target;

      /* infinity — skip animation */
      if (raw === '∞') { 
         el.innerHTML = `
          <svg class="infinity-icon" viewBox="0 0 100 50" aria-hidden="true">
            <path d="M15,25 C15,10 35,10 50,25 C65,40 85,40 85,25 C85,10 65,10 50,25 C35,40 15,40 15,25"
            fill="none"
            stroke="currentColor"
            stroke-width="6"
            stroke-linecap="round"/>
    </svg>
  `;
  return;
}

      /* placeholder dash — skip animation */
      if (raw === '—' || raw === '' || isNaN(Number(raw))) {
        el.textContent = '—';
        return;
      }

      const target   = Number(raw);
      const isPeople = el.id === 'impactPeople';
      const duration = isPeople ? 2600 : 2200;
      let start      = null;

      function step(ts) {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        /* ease out cubic */
        const eased = 1 - Math.pow(1 - progress, 3);
        const suffix = el.dataset.suffix || '';
        const isCarbon = el.id === 'impactCarbon';
        const isPeople = el.id === 'impactPeople';
        const value = eased * target;

        if (isPeople) {
        el.textContent = Math.floor(value);
        } 
        else if (isCarbon) {
        el.textContent = (value / 1000).toFixed(1) + 't';
        } 
        else {
        el.textContent = value.toFixed(1) + suffix;
        }
        if (progress < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    });
  }, { threshold: 0.3 });

  counters.forEach(el => obs.observe(el));
}


/* ── NAV ACTIVE STATE ────────────────────────────────────────── */
/*
   Called by nav.html after it injects itself.
   Reads data-page on <body> and marks the matching link active.

   Each page sets:  <body data-page="home">
   Values:          home | dagad | kshiiteej | contact
*/

function initNavActive() {
  const page  = document.body.dataset.page || '';
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    link.classList.remove('active');
    if (link.dataset.page === page) link.classList.add('active');
  });
}


/* ── COMPONENT LOADER ────────────────────────────────────────── */
/*
   Fetches HTML component files and injects them into
   placeholder elements on each page.

   Each page has placeholder divs:
     <div id="nav-slot"></div>
     <div id="ambient-slot"></div>
     <div id="ticker-slot"></div>
     <div id="footer-slot"></div>
     <div id="bag-strip-slot"></div>  ← only on home + dagad

   Call order matters — nav must load before initNavActive().
*/

async function loadComponent(slotId, file) {
  const slot = document.getElementById(slotId);
  if (!slot) return;
  try {
    const res  = await fetch(file);
    if (!res.ok) throw new Error('not found');
    const html = await res.text();
    slot.outerHTML = html;
  } catch (e) {
    console.warn('component load failed:', file, e);
  }
}

/*
   Master loader — call this once per page.
   Pass array of slot IDs to skip (e.g. no bag strip on contact).

   Usage in page <script>:
     loadComponents(['bag-strip-slot']).then(() => {
       initNavActive();
       initReveal();
       initCarousel('.carousel-slide', '.carr-dot');
     });
*/

async function loadComponents(skip) {
  skip = skip || [];

  const components = [
    { slot: 'ambient-slot',   file: 'components/ambient.html'   },
    { slot: 'nav-slot',       file: 'components/nav.html'        },
    { slot: 'ticker-slot',    file: 'components/ticker.html'     },
    { slot: 'footer-slot',    file: 'components/footer.html'     },
    { slot: 'bag-strip-slot', file: 'components/bag-strip.html'  },
  ];

  /* load all non-skipped components in parallel */
  await Promise.all(
    components
      .filter(c => !skip.includes(c.slot))
      .map(c => loadComponent(c.slot, c.file))
  );
}


/* ── WHATSAPP HELPER ─────────────────────────────────────────── */
/*
   Builds a WhatsApp URL with pre-filled message.
   Used by dagad shop tier selector + roulette reveal.

   Usage:
     const url = buildWaUrl('000081', 'mini tote', 'happy');
     window.open(url, '_blank');
*/

const WA_NUMBER = '919820013990';

function buildWaUrl(bagId, bagType, tier) {
  const msg = [
    'hi kshiiteej!',
    '',
    'i want to order:',
    'bag id: ' + bagId,
    'type: ' + bagType,
    'price tier: ' + tier,
    '',
    'please share payment details.'
  ].join('\n');

  return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
}


/* ── EMAIL → WHATSAPP FORM ───────────────────────────────────── */
/*
   Used on home.html signup section.
   Captures email, logs to mailer.php, opens WhatsApp.

   Usage:
     initEmailForm('emailInput', 'emailForm', 'formSuccess', 'waLink');
*/

function initEmailForm(inputId, formId, successId, waLinkId) {
  const input   = document.getElementById(inputId);
  const form    = document.getElementById(formId);
  const success = document.getElementById(successId);
  const waLink  = document.getElementById(waLinkId);

  if (!input || !form) return;

  async function handleSubmit() {
    const email = input.value.trim();
    if (!email || !email.includes('@')) {
      input.style.outline = '1px solid var(--orange)';
      input.focus();
      return;
    }

    const msg = encodeURIComponent(
      "hi kshiiteej! i'd like early access to the dagad catalogue.\n\nmy email: " + email
    );
    const url = 'https://wa.me/' + WA_NUMBER + '?text=' + msg;

    form.classList.add('hide');
    if (success) success.classList.add('show');
    if (waLink)  waLink.href = url;

    /* silent log to mailer.php */
    try {
      const fd = new FormData();
      fd.append('email', email);
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 3000);
      await fetch('mailer.php', { method: 'POST', body: fd, signal: ctrl.signal });
    } catch (e) { /* silent fail */ }

    setTimeout(() => window.open(url, '_blank'), 300);
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSubmit();
  });

  /* expose so inline onclick can call it */
  window.handleEmailSubmit = handleSubmit;
}
  function initFooterAnimation() {
  const footer = document.getElementById('siteFooter');
  if (!footer) return;
  const words = footer.querySelectorAll('.foot-word, .foot-sep');
  if (!words.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      obs.unobserve(entry.target);
      words.forEach(el => {
        const delay = parseInt(el.dataset.delay || 0);
        setTimeout(() => el.classList.add('foot-word-visible'), delay);
      });
    });
  }, { threshold: 0.2 });

  obs.observe(footer);
}

