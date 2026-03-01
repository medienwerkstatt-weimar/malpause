(() => {
  const heroTitle = document.getElementById("heroTitle");
  const heroLinkKunsttherapie = document.getElementById("heroLinkKunsttherapie");
  const heroLinkWorkshops = document.getElementById("heroLinkWorkshops");
  const heroLinkElternKind = document.getElementById("heroLinkElternKind");
  const heroSignature = document.getElementById("heroSignature");
  const nav = document.getElementById("mainNav");
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("mainMenu");

  if (!heroTitle || !heroLinkKunsttherapie || !heroLinkWorkshops || !heroLinkElternKind || !heroSignature || !nav || !navToggle || !navMenu) {
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobileBreakpoint = window.matchMedia("(max-width: 900px)");
  const showTitleDelay = 1000;
  const showLinksStartDelay = 2680;
  const showLinksStagger = 700;
  const pauseBeforeSignature = 850;
  const showSignatureDelay = showLinksStartDelay + showLinksStagger * 3 + pauseBeforeSignature;
  const navRevealDelay = showSignatureDelay + 1500;

  const interactionEvents = ["scroll", "wheel", "touchstart", "keydown", "mousedown"];
  let navRevealed = false;

  const showNav = () => {
    if (navRevealed) {
      return;
    }
    nav.classList.remove("is-hidden");
    navRevealed = true;
  };

  const bindEarlyReveal = () => {
    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, showNav, { once: true, passive: true });
    });
  };

  const initOfferCarousels = () => {
    const carousels = document.querySelectorAll("[data-carousel]");

    carousels.forEach((carousel) => {
      const slides = Array.from(carousel.querySelectorAll(".offer-carousel__slide"));
      const dots = Array.from(carousel.querySelectorAll(".offer-carousel__dot"));
      const prevBtn = carousel.querySelector("[data-carousel-prev]");
      const nextBtn = carousel.querySelector("[data-carousel-next]");

      if (!slides.length || !prevBtn || !nextBtn) {
        return;
      }

      let active = slides.findIndex((slide) => slide.classList.contains("is-active"));
      if (active < 0) {
        active = 0;
      }

      const render = () => {
        slides.forEach((slide, index) => {
          slide.classList.toggle("is-active", index === active);
        });
        dots.forEach((dot, index) => {
          dot.classList.toggle("is-active", index === active);
        });
      };

      prevBtn.addEventListener("click", () => {
        active = (active - 1 + slides.length) % slides.length;
        render();
      });

      nextBtn.addEventListener("click", () => {
        active = (active + 1) % slides.length;
        render();
      });

      dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
          active = index;
          render();
        });
      });

      render();
    });
  };

  const closeMobileMenu = () => {
    nav.classList.remove("is-menu-open");
    navToggle.setAttribute("aria-expanded", "false");
  };

  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-menu-open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (mobileBreakpoint.matches) {
        closeMobileMenu();
      }
    });
  });

  mobileBreakpoint.addEventListener("change", (event) => {
    if (!event.matches) {
      closeMobileMenu();
    }
  });

  bindEarlyReveal();
  initOfferCarousels();

  window.addEventListener("load", () => {
    if (reduceMotion) {
      heroTitle.classList.add("is-visible");
      heroLinkKunsttherapie.classList.add("is-visible");
      heroLinkWorkshops.classList.add("is-visible");
      heroLinkElternKind.classList.add("is-visible");
      heroSignature.classList.add("is-visible");
      showNav();
      return;
    }

    window.setTimeout(() => {
      heroTitle.classList.add("is-visible");
    }, showTitleDelay);

    window.setTimeout(() => {
      heroLinkKunsttherapie.classList.add("is-visible");
    }, showLinksStartDelay);

    window.setTimeout(() => {
      heroLinkWorkshops.classList.add("is-visible");
    }, showLinksStartDelay + showLinksStagger);

    window.setTimeout(() => {
      heroLinkElternKind.classList.add("is-visible");
    }, showLinksStartDelay + showLinksStagger * 2);

    window.setTimeout(() => {
      heroSignature.classList.add("is-visible");
    }, showSignatureDelay);

    window.setTimeout(() => {
      showNav();
    }, navRevealDelay);
  });
})();
