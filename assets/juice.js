(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ---------- flavor theming across the whole site ---------- */
  function applyTheme(color, ink, index) {
    var root = document.documentElement;
    root.style.setProperty('--flavor', color);
    root.style.setProperty('--flavor-ink', ink);
    root.style.setProperty('--theme', color);
    root.setAttribute('data-flavor-active', String(index));

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', color);

    try {
      sessionStorage.setItem('jkc-theme', JSON.stringify({ color: color, ink: ink, index: index }));
    } catch (e) {}
  }

  /* carry the chosen flavor onto other pages */
  function restoreTheme() {
    try {
      var saved = JSON.parse(sessionStorage.getItem('jkc-theme') || 'null');
      if (!saved || !saved.color) return;
      var root = document.documentElement;
      root.style.setProperty('--theme', saved.color);
      root.setAttribute('data-flavor-active', String(saved.index));
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', saved.color);
    } catch (e) {}
  }

  /* ---------- flavor switcher ---------- */
  function initFlavors() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) return;

    var chips = hero.querySelectorAll('[data-flavor]');
    var sets = hero.querySelectorAll('[data-fruit-set]');
    var titles = hero.querySelectorAll('[data-title]');
    var notes = hero.querySelectorAll('[data-note]');
    var ctas = hero.querySelectorAll('[data-cta]');
    if (!chips.length) return;

    function show(index) {
      chips.forEach(function (c) {
        var on = c.getAttribute('data-flavor') === String(index);
        c.classList.toggle('is-on', on);
        c.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on) {
          var color = c.getAttribute('data-color');
          var ink = c.getAttribute('data-ink');
          hero.style.setProperty('--flavor', color);
          hero.style.setProperty('--flavor-ink', ink);
          applyTheme(color, ink, index);
        }
      });
      sets.forEach(function (s) {
        var on = s.getAttribute('data-fruit-set') === String(index);
        s.classList.toggle('is-on', on);
        if (on && !reduced) {
          s.querySelectorAll('.fruit').forEach(function (f, i) {
            f.classList.remove('pop');
            void f.offsetWidth;
            f.style.animationDelay = (i * 0.05) + 's';
            f.classList.add('pop');
          });
        }
      });
      titles.forEach(function (t) {
        t.classList.toggle('is-on', t.getAttribute('data-title') === String(index));
      });
      notes.forEach(function (n) {
        n.classList.toggle('is-on', n.getAttribute('data-note') === String(index));
      });
      ctas.forEach(function (a) {
        a.classList.toggle('is-on', a.getAttribute('data-cta') === String(index));
      });
    }

    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        show(c.getAttribute('data-flavor'));
      });
    });

    show(0);
  }

  /* ---------- fruit drifts as you scroll ---------- */
  function initFruitScroll() {
    if (reduced) return;

    var fruit = Array.prototype.slice.call(document.querySelectorAll('.fruit'));
    if (!fruit.length) return;

    var fine = window.matchMedia('(pointer: fine)').matches;
    var ticking = false;
    var pointerX = 0, pointerY = 0;

    /* cache each fruit's drift factor once */
    var items = fruit.map(function (el) {
      var depth = parseFloat(el.getAttribute('data-depth')) || 30;
      return { el: el, factor: depth / 100 };
    });

    function render() {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;

      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        /* alternate direction so they separate instead of moving as a block */
        var dir = i % 2 === 0 ? -1 : 1;
        var shift = y * it.factor * 0.42 * dir;
        var spin = y * it.factor * 0.05 * dir;
        var drift = Math.sin((y + i * 220) / 420) * (10 * it.factor);

        it.el.style.transform =
          'translate3d(' + (drift + pointerX * it.factor).toFixed(2) + 'px,' +
          (shift + pointerY * it.factor).toFixed(2) + 'px,0) rotate(' +
          spin.toFixed(2) + 'deg)';
      }

      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(render);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    /* on desktop only, let the cursor add a small extra nudge */
    if (fine) {
      var hero = document.querySelector('[data-hero]');
      if (hero) {
        hero.addEventListener('mousemove', function (e) {
          var r = hero.getBoundingClientRect();
          pointerX = ((e.clientX - r.left) / r.width - 0.5) * 34;
          pointerY = ((e.clientY - r.top) / r.height - 0.5) * 22;
          onScroll();
        });
        hero.addEventListener('mouseleave', function () {
          pointerX = 0; pointerY = 0; onScroll();
        });
      }
    }

    render();
  }

  /* ---------- tap a fruit, it squishes ---------- */
  function initSquish() {
    if (reduced) return;
    document.querySelectorAll('.fruit').forEach(function (el) {
      el.addEventListener('click', function () {
        el.classList.remove('is-squish');
        void el.offsetWidth;
        el.classList.add('is-squish');
      });
    });
  }

  /* ---------- the flying watermelon ---------- */
  function initFly() {
    var host = document.querySelector('[data-fly]');
    if (!host || reduced) return;
    if (host.dataset.bound === '1') return;
    host.dataset.bound = '1';

    var minDelay = (parseFloat(host.dataset.minDelay) || 30) * 1000;
    var maxDelay = (parseFloat(host.dataset.maxDelay) || 45) * 1000;
    var firstDelay = (parseFloat(host.dataset.firstDelay) || 8) * 1000;
    var flightTime = (parseFloat(host.dataset.speed) || 9) * 1000;
    var size = parseFloat(host.dataset.size) || 110;

    if (maxDelay < minDelay) { var t = minDelay; minDelay = maxDelay; maxDelay = t; }

    host.style.width = size + 'px';

    var timer = null;
    var flying = false;

    function rand(a, b) { return a + Math.random() * (b - a); }

    /* build a wandering path of waypoints across the viewport */
    function buildPath() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      var pad = size;

      var leftToRight = Math.random() < 0.5;
      var startX = leftToRight ? -pad : w + pad;
      var endX = leftToRight ? w + pad : -pad;

      var frames = [];
      var hops = Math.round(rand(4, 7));

      frames.push({
        transform: 'translate3d(' + startX + 'px,' + rand(h * 0.15, h * 0.7) + 'px,0) rotate(0deg)',
        offset: 0
      });

      for (var i = 1; i < hops; i++) {
        var p = i / hops;
        var x = startX + (endX - startX) * p;
        /* drift up and down unpredictably, like a fly deciding mid-air */
        var y = rand(h * 0.08, h * 0.78);
        var tilt = rand(-18, 18);
        frames.push({
          transform: 'translate3d(' + x + 'px,' + y + 'px,0) rotate(' + tilt + 'deg)',
          offset: p
        });
      }

      frames.push({
        transform: 'translate3d(' + endX + 'px,' + rand(h * 0.15, h * 0.7) + 'px,0) rotate(0deg)',
        offset: 1
      });

      return frames;
    }

    var sayEl = host.querySelector('[data-fly-say]');
    var greetEvery = host.dataset.greetEvery === 'true';
    var GREETED = 'jkc-fly-greeted';

    function shouldGreet() {
      if (alreadyClaimed()) return false;
      if (greetEvery) return true;
      try { return localStorage.getItem(GREETED) !== '1'; } catch (e) { return true; }
    }

    function markGreeted() {
      try { localStorage.setItem(GREETED, '1'); } catch (e) {}
    }

    function flyOnce() {
      if (flying || document.hidden) { schedule(); return; }
      flying = true;

      host.classList.add('is-flying');

      if (sayEl && shouldGreet()) {
        markGreeted();
        setTimeout(function () { sayEl.classList.add('is-on'); }, 900);
        setTimeout(function () { sayEl.classList.remove('is-on'); }, 5200);
      }

      var frames = buildPath();
      var duration = rand(flightTime * 0.85, flightTime * 1.15);

      var anim;
      if (host.animate) {
        anim = host.animate(frames, {
          duration: duration,
          easing: 'cubic-bezier(.42,0,.58,1)',
          fill: 'forwards'
        });
        anim.onfinish = done;
      } else {
        setTimeout(done, duration);
      }

      function done() {
        host.classList.remove('is-flying');
        flying = false;
        schedule();
      }
    }

    function schedule(delay) {
      clearTimeout(timer);
      var wait = delay != null ? delay : rand(minDelay, maxDelay);
      timer = setTimeout(flyOnce, wait);
    }

    /* ---- swat tracking ---- */
    var needed = parseInt(host.dataset.swatsNeeded, 10) || 3;
    var showTally = host.dataset.showTally !== 'false';
    var tallyEl = host.querySelector('[data-fly-tally]');
    var KEY = 'jkc-swats';
    var CLAIMED = 'jkc-swat-claimed';

    function getSwats() {
      try { return parseInt(localStorage.getItem(KEY), 10) || 0; } catch (e) { return 0; }
    }
    function setSwats(n) {
      try { localStorage.setItem(KEY, String(n)); } catch (e) {}
    }
    function alreadyClaimed() {
      try { return localStorage.getItem(CLAIMED) === '1'; } catch (e) { return false; }
    }
    function markClaimed() {
      try { localStorage.setItem(CLAIMED, '1'); } catch (e) {}
    }

    function showTallyBubble(count) {
      if (!showTally || !tallyEl) return;
      var left = needed - count;
      tallyEl.textContent = left > 0
        ? (left === 1 ? 'one more' : left + ' more')
        : 'got him';
      tallyEl.classList.remove('is-on');
      void tallyEl.offsetWidth;
      tallyEl.classList.add('is-on');
      setTimeout(function () { tallyEl.classList.remove('is-on'); }, 1600);
    }

    function openReward() {
      var panel = document.querySelector('[data-reward]');
      if (!panel) return;
      panel.hidden = false;
      requestAnimationFrame(function () { panel.classList.add('is-open'); });
      var closer = panel.querySelector('[data-reward-close]');
      if (closer) closer.focus();
      markClaimed();
    }

    /* swat him and he tumbles off */
    host.addEventListener('click', function () {
      if (!flying) return;
      host.classList.add('is-swatted');
      if (sayEl) sayEl.classList.remove('is-on');

      var count = getSwats() + 1;
      setSwats(count);

      if (!alreadyClaimed() && count >= needed) {
        setTimeout(openReward, 700);
      } else if (!alreadyClaimed()) {
        showTallyBubble(count);
      }

      setTimeout(function () {
        host.classList.remove('is-swatted', 'is-flying');
        flying = false;
        schedule();
      }, 800);
    });

    /* don't fly to an empty room */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearTimeout(timer);
      else schedule();
    });

    schedule(firstDelay);
  }

  /* ---------- reward panel ---------- */
  function initReward() {
    var panel = document.querySelector('[data-reward]');
    if (!panel) return;
    if (panel.dataset.bound === '1') return;
    panel.dataset.bound = '1';

    function close() {
      panel.classList.remove('is-open');
      setTimeout(function () { panel.hidden = true; }, 300);
    }

    var closer = panel.querySelector('[data-reward-close]');
    if (closer) closer.addEventListener('click', close);

    panel.addEventListener('click', function (e) {
      if (e.target === panel) close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) close();
    });

    var copyBtn = panel.querySelector('[data-reward-copy]');
    var codeEl = panel.querySelector('[data-reward-code]');
    if (copyBtn && codeEl) {
      copyBtn.addEventListener('click', function () {
        var code = (codeEl.textContent || '').trim();
        var done = function () {
          copyBtn.textContent = 'Copied';
          setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(done, done);
        } else {
          var ta = document.createElement('textarea');
          ta.value = code;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); } catch (e) {}
          document.body.removeChild(ta);
          done();
        }
      });
    }
  }

  /* ---------- mobile menu ---------- */
  function initMenu() {
    var drawer = document.querySelector('[data-drawer]');
    var burger = document.querySelector('[data-menu-open]');
    if (!drawer || !burger) return;
    if (drawer.dataset.bound === '1') return;
    drawer.dataset.bound = '1';

    var panel = drawer.querySelector('.drawer__panel');
    var lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      drawer.hidden = false;
      document.body.classList.add('menu-open');
      requestAnimationFrame(function () { drawer.classList.add('is-open'); });
      burger.setAttribute('aria-expanded', 'true');
      var first = panel.querySelector('a, button');
      if (first) first.focus();
    }

    function close() {
      drawer.classList.remove('is-open');
      document.body.classList.remove('menu-open');
      burger.setAttribute('aria-expanded', 'false');
      setTimeout(function () { drawer.hidden = true; }, 340);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    burger.addEventListener('click', function () {
      if (drawer.hidden) open(); else close();
    });

    drawer.querySelectorAll('[data-menu-close]').forEach(function (el) {
      el.addEventListener('click', close);
    });

    /* close after tapping a real link */
    drawer.querySelectorAll('a[href]').forEach(function (a) {
      a.addEventListener('click', function () { close(); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !drawer.hidden) close();
    });

    /* keep tab focus inside the panel while it's open */
    panel.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var items = panel.querySelectorAll('a[href], button:not([disabled]), summary');
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });

    /* if the window grows past the breakpoint, drop the drawer */
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 700 && !drawer.hidden) close();
    });
  }

  /* ---------- card tilt ---------- */
  function initTilt() {
    if (reduced) return;
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(700px) rotateY(' + (x * 7).toFixed(2) + 'deg) rotateX(' + (-y * 7).toFixed(2) + 'deg) translateY(-4px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- batch calculator ---------- */
  function initBatch() {
    var range = document.querySelector('[data-batch-range]');
    if (!range) return;

    var qtyOut = document.querySelector('[data-batch-qty]');
    var unitOut = document.querySelector('[data-batch-unit]');
    var totalOut = document.querySelector('[data-batch-total]');
    var savedOut = document.querySelector('[data-batch-saved]');
    var tierOut = document.querySelector('[data-batch-tier]');
    var pipWrap = document.querySelector('[data-batch-pips]');
    var panel = range.closest('.batch__panel');

    var tiers;
    try {
      tiers = JSON.parse(range.getAttribute('data-tiers'));
    } catch (e) {
      tiers = [{ qty: 1, price: 9, color: '#8A8580', label: '' }];
    }

    tiers = tiers
      .filter(function (t) { return t && !isNaN(parseFloat(t.price)) && !isNaN(parseInt(t.qty, 10)); })
      .map(function (t) {
        return {
          qty: parseInt(t.qty, 10),
          price: parseFloat(t.price),
          color: t.color || '#8A8580',
          label: t.label || ''
        };
      })
      .sort(function (a, b) { return a.qty - b.qty; });

    if (!tiers.length) return;

    var base = tiers[0].price;
    var money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

    function tierFor(qty) {
      var found = tiers[0];
      for (var i = 0; i < tiers.length; i++) {
        if (qty >= tiers[i].qty) found = tiers[i];
      }
      return found;
    }

    function nextTier(qty) {
      for (var i = 0; i < tiers.length; i++) {
        if (tiers[i].qty > qty) return tiers[i];
      }
      return null;
    }

    /* markers on the track for each price break */
    function buildPips() {
      if (!pipWrap) return;
      var min = parseFloat(range.min) || 0;
      var max = parseFloat(range.max) || 100;
      var span = max - min;
      if (span <= 0) return;
      pipWrap.innerHTML = '';
      tiers.forEach(function (t) {
        if (t.qty < min || t.qty > max) return;
        var pct = ((t.qty - min) / span) * 100;
        var pip = document.createElement('span');
        pip.className = 'batch__pip';
        pip.style.left = pct + '%';
        pip.style.setProperty('--pip', t.color);
        pip.innerHTML = '<i></i><b>' + t.qty + '</b>';
        pipWrap.appendChild(pip);
      });
    }

    function update() {
      var qty = parseInt(range.value, 10) || 0;
      var tier = tierFor(qty);
      var unit = tier.price;
      var total = Math.round(qty * unit * 100) / 100;
      var saved = Math.round((qty * base - total) * 100) / 100;

      if (qtyOut) qtyOut.textContent = qty.toLocaleString('en-US');
      if (unitOut) unitOut.textContent = money.format(unit);
      if (totalOut) totalOut.textContent = money.format(total);
      if (savedOut) savedOut.textContent = saved > 0 ? money.format(saved) : '—';

      if (panel) {
        panel.style.setProperty('--tier-color', tier.color);
      }

      /* fill the track up to the handle in the tier color */
      var min = parseFloat(range.min) || 0;
      var max = parseFloat(range.max) || 100;
      var pct = max > min ? ((qty - min) / (max - min)) * 100 : 0;
      range.style.setProperty('--fill', pct + '%');

      if (tierOut) {
        var nxt = nextTier(qty);
        if (nxt) {
          var away = nxt.qty - qty;
          tierOut.textContent = away + (away === 1 ? ' more bottle drops it to ' : ' more bottles drop it to ') + money.format(nxt.price) + ' each';
        } else {
          tierOut.textContent = tier.label;
        }
      }

      /* pulse the price when the tier changes */
      if (unitOut && unitOut.dataset.last !== String(unit)) {
        unitOut.dataset.last = String(unit);
        unitOut.classList.remove('is-bump');
        void unitOut.offsetWidth;
        unitOut.classList.add('is-bump');
      }
    }

    buildPips();
    range.addEventListener('input', update);
    update();
  }

  /* ---------- variant price ---------- */
  function initVariant() {
    var sel = document.querySelector('[data-variant-select]');
    var out = document.querySelector('[data-pdp-price]');
    if (!sel || !out) return;
    sel.addEventListener('change', function () {
      var opt = sel.options[sel.selectedIndex];
      var price = opt && opt.getAttribute('data-price');
      if (price) out.textContent = price;
    });
  }

  /* ---------- cart count ---------- */
  function initCart() {
    var form = document.getElementById('AddForm');
    if (!form) return;
    form.addEventListener('submit', function () {
      setTimeout(function () {
        fetch('/cart.js', { credentials: 'same-origin' })
          .then(function (r) { return r.json(); })
          .then(function (cart) {
            var badge = document.querySelector('[data-cart-count]');
            if (badge) badge.textContent = cart.item_count;
          })
          .catch(function () {});
      }, 350);
    });
  }

  ready(function () {
    restoreTheme();
    initMenu();
    initFlavors();
    initFruitScroll();
    initSquish();
    initFly();
    initReward();
    initTilt();
    initBatch();
    initVariant();
    initCart();
  });

  document.addEventListener('shopify:section:load', function () {
    initMenu();
    initFlavors();
    initFruitScroll();
    initSquish();
    initTilt();
    initBatch();
  });
})();
