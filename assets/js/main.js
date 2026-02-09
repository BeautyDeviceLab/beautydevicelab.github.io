/* =========================================================
   BeautyDeviceLab — main.js (ULTRA LUXE “BARBIE” v2)
   - Mobile menu toggle (body data-menu="open") + scroll lock no-jump
   - Smooth anchor scroll (offset auto selon header sticky)
   - Active section highlight (optional)
   - Table responsive labels helper (optional)
   - Sticky CTA show/hide (optional)
   - Affiliate click tracking (GA4 gtag if present)
   - Theme toggle (optional) with localStorage
   - TOC builder (optional)
   - Copy link buttons (optional)
   - External links rel hygiene
   ========================================================= */

(() => {
  "use strict";

  /* -------------------- Config -------------------- */
  const CFG = {
    menuOpenAttr: "data-menu",
    menuOpenValue: "open",

    headerSelector: ".site-header",
    smoothScrollExtraOffset: 10,

    activeSectionOffset: 140,
    activeLinkClass: "is-active",
    activeScopeSelector: "main", // set "" to disable scoping

    stickyCtaSelector: ".sticky-cta",
    stickyCtaRevealAfter: 420,

    themeAttr: "data-theme", // :root[data-theme="light"]
    themeKey: "bdl_theme",
    defaultTheme: "dark",

    tocMinHeadings: 3,
  };

  /* -------------------- Helpers -------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  const getHeaderOffset = () => {
    const header = $(CFG.headerSelector);
    const h = header ? Math.ceil(header.getBoundingClientRect().height || 0) : 0;
    return h + CFG.smoothScrollExtraOffset;
  };

  /* -------------------- Scroll lock (no page jump) -------------------- */
  const ScrollLock = (() => {
    let savedY = 0;
    let locked = false;

    const lock = () => {
      if (locked) return;
      locked = true;

      savedY = window.scrollY || window.pageYOffset || 0;
      document.body.style.position = "fixed";
      document.body.style.top = `-${savedY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
    };

    const unlock = () => {
      if (!locked) return;
      locked = false;

      const top = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";

      const y = top ? Math.abs(parseInt(top, 10)) : savedY;
      window.scrollTo(0, y);
    };

    return { lock, unlock };
  })();

  const setBodyMenu = (isOpen) => {
    if (isOpen) document.body.setAttribute(CFG.menuOpenAttr, CFG.menuOpenValue);
    else document.body.removeAttribute(CFG.menuOpenAttr);
  };

  const isMenuOpen = () =>
    document.body.getAttribute(CFG.menuOpenAttr) === CFG.menuOpenValue;

  /* -------------------- 1) Mobile Menu -------------------- */
  function initMobileMenu() {
    const btn = $("#menuToggle");
    const nav = $("#siteNavLinks");
    if (!btn || !nav) return;

    const closeMenu = () => {
      if (!isMenuOpen()) return;
      setBodyMenu(false);
      btn.setAttribute("aria-expanded", "false");
      ScrollLock.unlock();
    };

    const openMenu = () => {
      if (isMenuOpen()) return;
      setBodyMenu(true);
      btn.setAttribute("aria-expanded", "true");
      ScrollLock.lock();
    };

    btn.addEventListener("click", () => {
      isMenuOpen() ? closeMenu() : openMenu();
    });

    // Close on nav link click (mobile)
    nav.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      if (window.matchMedia("(max-width: 860px)").matches) closeMenu();
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (!isMenuOpen()) return;
      const inBtn = e.target.closest("#menuToggle");
      const inNav = e.target.closest("#siteNavLinks");
      if (!inBtn && !inNav) closeMenu();
    });

    // Close on resize up
    window.addEventListener("resize", () => {
      if (!window.matchMedia("(max-width: 860px)").matches) closeMenu();
    });
  }

  /* -------------------- 2) Smooth Anchor Scroll -------------------- */
  function initSmoothScroll() {
    if (prefersReducedMotion()) return;

    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;

      const href = a.getAttribute("href");
      if (!href || href === "#") return;

      const id = href.slice(1);
      const target = document.getElementById(id);
      if (!target) return;

      // If menu open on mobile, close first
      if (isMenuOpen() && window.matchMedia("(max-width: 860px)").matches) {
        setBodyMenu(false);
        const btn = $("#menuToggle");
        if (btn) btn.setAttribute("aria-expanded", "false");
        ScrollLock.unlock();
      }

      e.preventDefault();

      const rect = target.getBoundingClientRect();
      const top = window.scrollY + rect.top - getHeaderOffset();

      window.scrollTo({ top, behavior: "smooth" });
      history.pushState(null, "", `#${id}`);
    });
  }

  /* -------------------- 3) Active Section Highlight -------------------- */
  function initActiveSection() {
    const scope = CFG.activeScopeSelector ? $(CFG.activeScopeSelector) : document;
    if (!scope) return;

    const links = $$('a[href^="#"]', scope)
      .filter((a) => (a.getAttribute("href") || "").length > 1)
      .filter((a) => document.getElementById(a.getAttribute("href").slice(1)));

    if (!links.length) return;

    const targets = links
      .map((a) => document.getElementById(a.getAttribute("href").slice(1)))
      .filter(Boolean);

    const setActive = () => {
      const y = window.scrollY + CFG.activeSectionOffset;
      let activeId = "";

      for (const sec of targets) {
        if (sec.offsetTop <= y) activeId = sec.id;
      }

      links.forEach((a) => {
        const isActive = a.getAttribute("href") === `#${activeId}`;
        a.classList.toggle(CFG.activeLinkClass, isActive);
        if (isActive) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    };

    setActive();
    window.addEventListener("scroll", rafThrottle(setActive), { passive: true });
    window.addEventListener("resize", rafThrottle(setActive));
  }

  /* -------------------- 4) Responsive Table Labels Helper -------------------- */
  function initTableLabels() {
    const tables = $$("table");
    if (!tables.length) return;

    tables.forEach((table) => {
      const thead = table.querySelector("thead");
      const tbody = table.querySelector("tbody");
      if (!tbody) return;

      let headers = [];

      if (thead) {
        headers = $$("th", thead).map((th) => (th.textContent || "").trim()).filter(Boolean);
      } else {
        const firstRow = table.querySelector("tr");
        if (firstRow) {
          headers = $$("th,td", firstRow).map((c) => (c.textContent || "").trim()).filter(Boolean);
        }
      }

      if (!headers.length) return;

      $$("tr", tbody).forEach((tr) => {
        const tds = $$("td", tr);
        tds.forEach((td, i) => {
          if (!td.hasAttribute("data-label") && headers[i]) {
            td.setAttribute("data-label", headers[i]);
          }
        });
      });
    });
  }

  /* -------------------- 5) Sticky CTA Reveal -------------------- */
  function initStickyCta() {
    const el = $(CFG.stickyCtaSelector);
    if (!el) return;

    const fancy = !prefersReducedMotion();

    const update = () => {
      const show = window.scrollY > CFG.stickyCtaRevealAfter;
      el.style.opacity = show ? "1" : "0";
      el.style.transform = show ? "translateY(0)" : "translateY(6px)";
      el.style.pointerEvents = show ? "auto" : "none";
    };

    if (fancy) {
      el.style.transition =
        "opacity 180ms cubic-bezier(.2,.8,.2,1), transform 180ms cubic-bezier(.2,.8,.2,1)";
    }

    update();
    window.addEventListener("scroll", rafThrottle(update), { passive: true });
    window.addEventListener("resize", rafThrottle(update));
  }

  /* -------------------- 6) Affiliate Click Tracking (GA4 gtag) -------------------- */
  function trackAffiliateClick(label, url) {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", "affiliate_click", {
          event_category: "affiliate",
          event_label: label || url || "unknown",
          transport_type: "beacon",
        });
      }
    } catch (_) {}
  }

  function initAffiliateTracking() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;

      const href = a.getAttribute("href") || "";
      if (!href) return;

      const rel = (a.getAttribute("rel") || "").toLowerCase();
      const isExplicit = a.classList.contains("js-aff") || a.hasAttribute("data-aff");
      const isSponsored = rel.includes("sponsored");
      const looksAmazon = /amazon\.(ca|com)\//i.test(href);
      const hasTag = /[?&]tag=/i.test(href);

      if (isExplicit || isSponsored || (looksAmazon && hasTag)) {
        const label =
          a.getAttribute("data-label") ||
          a.getAttribute("data-aff") ||
          a.getAttribute("aria-label") ||
          (a.textContent || "").trim().slice(0, 70) ||
          "affiliate";

        trackAffiliateClick(label, href);
      }
    });
  }

  /* -------------------- 7) Theme Toggle (optional) -------------------- */
  function setTheme(theme) {
    const t = (theme === "light" || theme === "dark") ? theme : CFG.defaultTheme;
    if (t === "light") document.documentElement.setAttribute(CFG.themeAttr, "light");
    else document.documentElement.removeAttribute(CFG.themeAttr);
    try { localStorage.setItem(CFG.themeKey, t); } catch {}
  }

  function getTheme() {
    try { return localStorage.getItem(CFG.themeKey) || CFG.defaultTheme; }
    catch { return CFG.defaultTheme; }
  }

  function initThemeToggle() {
    const btn = $("#themeToggle");
    setTheme(getTheme());
    if (!btn) return;

    const sync = () => {
      const t = getTheme();
      btn.setAttribute("aria-pressed", t === "light" ? "true" : "false");
      btn.setAttribute("data-theme", t);
    };

    btn.addEventListener("click", () => {
      const next = getTheme() === "light" ? "dark" : "light";
      setTheme(next);
      sync();
    });

    sync();
  }

  /* -------------------- 8) Auto TOC Builder (optional) -------------------- */
  function slugify(text) {
    return (text || "")
      .toLowerCase()
      .trim()
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  function initTOC() {
    const toc = $("#toc");
    if (!toc) return;

    const headings = $$("main h2, main h3").filter((h) => (h.textContent || "").trim().length);
    if (headings.length < CFG.tocMinHeadings) return;

    const list = document.createElement("ul");
    list.className = "toc-list";
    list.style.listStyle = "none";
    list.style.padding = "0";
    list.style.margin = "0";

    headings.forEach((h) => {
      if (!h.id) h.id = slugify(h.textContent);

      const li = document.createElement("li");
      li.style.margin = "8px 0";

      const a = document.createElement("a");
      a.href = `#${h.id}`;
      a.textContent = (h.textContent || "").trim();
      a.style.display = "inline-block";
      a.style.color = "inherit";
      a.style.opacity = h.tagName.toLowerCase() === "h3" ? "0.78" : "0.92";
      a.style.paddingLeft = h.tagName.toLowerCase() === "h3" ? "14px" : "0";

      li.appendChild(a);
      list.appendChild(li);
    });

    toc.innerHTML = "";
    toc.appendChild(list);
  }

  /* -------------------- 9) Copy Link Buttons (optional) -------------------- */
  function initCopyLinks() {
    document.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-copy-link]");
      if (!btn) return;

      e.preventDefault();
      const url = btn.getAttribute("data-copy-link") || window.location.href;

      try {
        await navigator.clipboard.writeText(url);
        btn.setAttribute("data-copied", "true");
        const prev = btn.textContent;
        btn.textContent = "Copied ✓";
        setTimeout(() => {
          btn.textContent = prev;
          btn.removeAttribute("data-copied");
        }, 1200);
      } catch {}
    });
  }

  /* -------------------- 10) External links safety -------------------- */
  function initExternalLinks() {
    $$('a[target="_blank"]').forEach((a) => {
      const href = a.getAttribute("href") || "";
      const rel = (a.getAttribute("rel") || "")
        .split(/\s+/)
        .map((x) => x.trim())
        .filter(Boolean);

      const ensure = (token) => { if (!rel.includes(token)) rel.push(token); };

      ensure("noopener");
      ensure("noreferrer");

      const isAffiliateish =
        a.classList.contains("js-aff") ||
        a.hasAttribute("data-aff") ||
        /amazon\.(ca|com)\//i.test(href) ||
        /[?&]tag=/i.test(href);

      if (isAffiliateish) ensure("nofollow");

      a.setAttribute("rel", rel.join(" "));
    });
  }

  /* -------------------- Init -------------------- */
  function init() {
    initMobileMenu();
    initSmoothScroll();
    initActiveSection();
    initTableLabels();
    initStickyCta();
    initAffiliateTracking();
    initThemeToggle();
    initTOC();
    initCopyLinks();
    initExternalLinks();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
