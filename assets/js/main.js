/* =========================================================
   BeautyDeviceLab — assets/js/app.js (ULTRA LUXE “BARBIE”)
   Features:
   - Mobile menu toggle (body data-menu="open")
   - Smooth scroll (safe)
   - Active section highlight (optional)
   - Table responsive labels helper (optional)
   - Sticky CTA show/hide (optional)
   - Affiliate click tracking hook (GA4 gtag if present)
   - Theme toggle (optional: dark/light) with localStorage
   - Tiny utilities (copy link, TOC builder optional)
   No dependencies.
   ========================================================= */

(() => {
  "use strict";

  /* -------------------- Config -------------------- */
  const CFG = {
    menuOpenAttr: "data-menu",
    menuOpenValue: "open",
    themeAttr: "data-theme", // matches CSS :root[data-theme="light"]
    themeKey: "bdl_theme",
    defaultTheme: "dark",
    smoothScrollOffset: 10, // px
    tocMinHeadings: 3,
    activeSectionOffset: 120, // px from top
    stickyCtaSelector: ".sticky-cta",
    stickyCtaRevealAfter: 420, // px scrolled
  };

  /* -------------------- Helpers -------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const safeJsonParse = (s, fallback = null) => {
    try { return JSON.parse(s); } catch { return fallback; }
  };

  const setBodyMenu = (isOpen) => {
    document.body.setAttribute(CFG.menuOpenAttr, isOpen ? CFG.menuOpenValue : "");
    if (!isOpen) document.body.removeAttribute(CFG.menuOpenAttr);
  };

  const isMenuOpen = () =>
    document.body.getAttribute(CFG.menuOpenAttr) === CFG.menuOpenValue;

  /* -------------------- 1) Mobile Menu -------------------- */
  function initMobileMenu() {
    const btn = $("#menuToggle");
    const nav = $("#siteNavLinks");
    if (!btn || !nav) return;

    const closeMenu = () => {
      setBodyMenu(false);
      btn.setAttribute("aria-expanded", "false");
    };

    const openMenu = () => {
      setBodyMenu(true);
      btn.setAttribute("aria-expanded", "true");
    };

    btn.addEventListener("click", () => {
      const open = isMenuOpen();
      open ? closeMenu() : openMenu();
    });

    // Close when clicking a nav link (mobile drawer)
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
    // Let browser handle if reduced motion
    if (prefersReducedMotion()) return;

    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;

      const href = a.getAttribute("href");
      if (!href || href === "#") return;

      const id = href.slice(1);
      const target = document.getElementById(id);
      if (!target) return;

      e.preventDefault();

      const rect = target.getBoundingClientRect();
      const top = window.scrollY + rect.top - CFG.smoothScrollOffset;

      window.scrollTo({ top, behavior: "smooth" });

      // Update URL hash without jump
      history.pushState(null, "", `#${id}`);
    });
  }

  /* -------------------- 3) Active Section Highlight -------------------- */
  function initActiveSection() {
    const links = $$('a[href^="#"]').filter(a => a.getAttribute("href").length > 1);
    if (!links.length) return;

    const targets = links
      .map(a => document.getElementById(a.getAttribute("href").slice(1)))
      .filter(Boolean);

    if (!targets.length) return;

    const setActive = () => {
      const y = window.scrollY + CFG.activeSectionOffset;

      let activeId = "";
      for (const sec of targets) {
        if (sec.offsetTop <= y) activeId = sec.id;
      }

      links.forEach(a => {
        const isActive = a.getAttribute("href") === `#${activeId}`;
        a.classList.toggle("is-active", isActive);
        if (isActive) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    };

    setActive();
    window.addEventListener("scroll", () => requestAnimationFrame(setActive), { passive: true });
  }

  /* Optional CSS hook: you can style .is-active if you want */
  // .nav-links a.is-active { ... }

  /* -------------------- 4) Responsive Table Labels Helper -------------------- */
  function initTableLabels() {
    // For mobile stacked table: we rely on td[data-label]
    // If the HTML doesn't have data-label, we can auto-add from headers.
    const tables = $$("table");
    if (!tables.length) return;

    tables.forEach((table) => {
      const thead = table.querySelector("thead");
      const tbody = table.querySelector("tbody");
      if (!thead || !tbody) return;

      const headers = $$("th", thead).map(th => (th.textContent || "").trim()).filter(Boolean);
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

    const update = () => {
      const show = window.scrollY > CFG.stickyCtaRevealAfter;
      el.style.opacity = show ? "1" : "0";
      el.style.transform = show ? "translateY(0)" : "translateY(6px)";
      el.style.pointerEvents = show ? "auto" : "none";
    };

    // Initial styles for buttery entry
    el.style.transition = "opacity 180ms cubic-bezier(.2,.8,.2,1), transform 180ms cubic-bezier(.2,.8,.2,1)";
    update();

    window.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
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
    // Track any anchor that looks like an affiliate link.
    // You can mark explicitly with data-aff="Amazon" or class "js-aff".
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;

      const href = a.getAttribute("href") || "";
      const isExplicit = a.classList.contains("js-aff") || a.hasAttribute("data-aff");
      const looksAmazon = /amazon\.(ca|com)\//i.test(href);
      const hasTag = /[?&]tag=/i.test(href);

      if (isExplicit || (looksAmazon && hasTag)) {
        const label =
          a.getAttribute("data-label") ||
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
    localStorage.setItem(CFG.themeKey, t);
  }

  function getTheme() {
    return localStorage.getItem(CFG.themeKey) || CFG.defaultTheme;
  }

  function initThemeToggle() {
    // Optional button id="themeToggle"
    const btn = $("#themeToggle");
    setTheme(getTheme());

    if (!btn) return;

    const syncText = () => {
      const t = getTheme();
      btn.setAttribute("aria-pressed", t === "light" ? "true" : "false");
      btn.setAttribute("data-theme", t);
    };

    btn.addEventListener("click", () => {
      const next = getTheme() === "light" ? "dark" : "light";
      setTheme(next);
      syncText();
    });

    syncText();
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
    // Create a TOC inside an element with id="toc"
    const toc = $("#toc");
    if (!toc) return;

    const headings = $$("main h2, main h3").filter(h => (h.textContent || "").trim().length);
    if (headings.length < CFG.tocMinHeadings) return;

    const list = document.createElement("ul");
    list.style.listStyle = "none";
    list.style.padding = "0";
    list.style.margin = "0";
    list.className = "toc-list";

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
    // Any button/link with [data-copy-link] copies its URL value or current page URL
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
      } catch {
        // Fallback: do nothing (clipboard may be blocked)
      }
    });
  }

  /* -------------------- 10) External links safety (nofollow noopener) -------------------- */
  function initExternalLinks() {
    $$('a[target="_blank"]').forEach((a) => {
      const rel = (a.getAttribute("rel") || "").split(/\s+/).filter(Boolean);
      const want = ["noopener", "noreferrer"];
      want.forEach(x => { if (!rel.includes(x)) rel.push(x); });
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
