(() => {
  let cleanup = null;

  const initMalpauseUI = () => {
    if (typeof cleanup === "function") {
      cleanup();
      cleanup = null;
    }

    const heroTitle = document.getElementById("heroTitle");
    const heroLinkKunsttherapie = document.getElementById("heroLinkKunsttherapie");
    const heroLinkWorkshops = document.getElementById("heroLinkWorkshops");
    const heroLinkElternKind = document.getElementById("heroLinkElternKind");
    const heroSignature = document.getElementById("heroSignature");
    const nav = document.getElementById("mainNav");
    const navToggle = document.getElementById("navToggle");
    const navMenu = document.getElementById("mainMenu");

    if (
      !heroTitle ||
      !heroLinkKunsttherapie ||
      !heroLinkWorkshops ||
      !heroLinkElternKind ||
      !heroSignature ||
      !nav ||
      !navToggle ||
      !navMenu
    ) {
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
    const removeListeners = [];
    const timers = [];
    let navRevealed = false;

    const on = (target, eventName, listener, options) => {
      target.addEventListener(eventName, listener, options);
      removeListeners.push(() => target.removeEventListener(eventName, listener, options));
    };

    const showNav = () => {
      if (navRevealed) {
        return;
      }

      nav.classList.remove("is-hidden");
      navRevealed = true;
    };

    const initOfferCarousels = () => {
      const carousels = document.querySelectorAll("[data-carousel]");
      const swipeThreshold = 45;
      const verticalTolerance = 30;

      carousels.forEach((carousel) => {
        const slides = Array.from(carousel.querySelectorAll(".offer-carousel__slide"));
        const dots = Array.from(carousel.querySelectorAll(".offer-carousel__dot"));
        const prevBtn = carousel.querySelector("[data-carousel-prev]");
        const nextBtn = carousel.querySelector("[data-carousel-next]");
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        let trackingTouch = false;

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

        on(prevBtn, "click", () => {
          active = (active - 1 + slides.length) % slides.length;
          render();
        });

        on(nextBtn, "click", () => {
          active = (active + 1) % slides.length;
          render();
        });

        dots.forEach((dot, index) => {
          on(dot, "click", () => {
            active = index;
            render();
          });
        });

        on(
          carousel,
          "touchstart",
          (event) => {
            if (!event.touches.length) {
              return;
            }

            const touch = event.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchEndX = touch.clientX;
            touchEndY = touch.clientY;
            trackingTouch = true;
          },
          { passive: true },
        );

        on(
          carousel,
          "touchmove",
          (event) => {
            if (!trackingTouch || !event.touches.length) {
              return;
            }

            const touch = event.touches[0];
            touchEndX = touch.clientX;
            touchEndY = touch.clientY;
          },
          { passive: true },
        );

        on(
          carousel,
          "touchend",
          () => {
            if (!trackingTouch) {
              return;
            }

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const horizontalSwipe = Math.abs(deltaX) >= swipeThreshold;
            const mostlyHorizontal = Math.abs(deltaX) > Math.abs(deltaY) + verticalTolerance;

            if (horizontalSwipe && mostlyHorizontal) {
              if (deltaX < 0) {
                active = (active + 1) % slides.length;
              } else {
                active = (active - 1 + slides.length) % slides.length;
              }
              render();
            }

            trackingTouch = false;
          },
          { passive: true },
        );

        on(
          carousel,
          "touchcancel",
          () => {
            trackingTouch = false;
          },
          { passive: true },
        );

        render();
      });
    };

    const closeMobileMenu = () => {
      nav.classList.remove("is-menu-open");
      navToggle.setAttribute("aria-expanded", "false");
    };

    const revealOnInteraction = () => {
      showNav();
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, revealOnInteraction);
      });
    };

    interactionEvents.forEach((eventName) => {
      on(window, eventName, revealOnInteraction, { passive: true });
    });

    on(navToggle, "click", () => {
      const isOpen = nav.classList.toggle("is-menu-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    navMenu.querySelectorAll("a").forEach((link) => {
      on(link, "click", () => {
        if (mobileBreakpoint.matches) {
          closeMobileMenu();
        }
      });
    });

    on(mobileBreakpoint, "change", (event) => {
      if (!event.matches) {
        closeMobileMenu();
      }
    });

    initOfferCarousels();

    if (reduceMotion) {
      heroTitle.classList.add("is-visible");
      heroLinkKunsttherapie.classList.add("is-visible");
      heroLinkWorkshops.classList.add("is-visible");
      heroLinkElternKind.classList.add("is-visible");
      heroSignature.classList.add("is-visible");
      showNav();
    } else {
      timers.push(
        window.setTimeout(() => {
          heroTitle.classList.add("is-visible");
        }, showTitleDelay),
      );

      timers.push(
        window.setTimeout(() => {
          heroLinkKunsttherapie.classList.add("is-visible");
        }, showLinksStartDelay),
      );

      timers.push(
        window.setTimeout(() => {
          heroLinkWorkshops.classList.add("is-visible");
        }, showLinksStartDelay + showLinksStagger),
      );

      timers.push(
        window.setTimeout(() => {
          heroLinkElternKind.classList.add("is-visible");
        }, showLinksStartDelay + showLinksStagger * 2),
      );

      timers.push(
        window.setTimeout(() => {
          heroSignature.classList.add("is-visible");
        }, showSignatureDelay),
      );

      timers.push(
        window.setTimeout(() => {
          showNav();
        }, navRevealDelay),
      );
    }

    cleanup = () => {
      removeListeners.forEach((remove) => remove());
      timers.forEach((timerId) => window.clearTimeout(timerId));
    };
  };

  window.initMalpauseUI = initMalpauseUI;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMalpauseUI, { once: true });
  } else {
    initMalpauseUI();
  }
})();
