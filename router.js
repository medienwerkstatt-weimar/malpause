(() => {
  const ALLOWED_PAGES = new Set([
    "index.html",
    "workshops.html",
    "kunsttherapie.html",
    "eltern-kind-kurse.html",
  ]);
  const HOME_PAGE = "index.html";

  const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");
  let isNavigating = false;
  let currentIndex = 0;
  let scrollFrame = 0;

  const getPageFile = (pathname) => {
    const hadTrailingSlash = pathname.endsWith("/");
    const trimmed = pathname.replace(/\/+$/, "");

    if (!trimmed || hadTrailingSlash) {
      return "index.html";
    }

    const file = (trimmed.split("/").pop() || "index.html").toLowerCase();
    return file || "index.html";
  };

  const isAllowedUrl = (url) => ALLOWED_PAGES.has(getPageFile(url.pathname));
  const currentPage = () => getPageFile(window.location.pathname);

  const normalizePageToken = (value) => {
    if (!value) {
      return null;
    }

    const token = value.toLowerCase().trim();
    if (!token) {
      return null;
    }

    if (token.endsWith(".html")) {
      return token;
    }

    return `${token}.html`;
  };

  const activePage = () =>
    normalizePageToken(document.getElementById("app")?.dataset.page) || currentPage();

  const resolveDirection = (fromPage, toPage, fallbackDirection = "forward") => {
    if (fromPage === toPage) {
      return fallbackDirection;
    }

    if (toPage === HOME_PAGE && fromPage !== HOME_PAGE) {
      return "back";
    }

    if (fromPage === HOME_PAGE && toPage !== HOME_PAGE) {
      return "forward";
    }

    return fallbackDirection;
  };

  const hasViewTransitions = () =>
    typeof document.startViewTransition === "function" && !REDUCED_MOTION.matches;

  const replaceState = (patch, url = window.location.href) => {
    const baseState =
      history.state && typeof history.state === "object" ? history.state : {};
    history.replaceState({ ...baseState, router: true, ...patch }, "", url);
  };

  const shouldSkipLink = (event, link) => {
    if (event.defaultPrevented || event.button !== 0) {
      return true;
    }

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return true;
    }

    if (link.hasAttribute("download")) {
      return true;
    }

    const target = (link.getAttribute("target") || "").toLowerCase();
    if (target && target !== "_self") {
      return true;
    }

    return false;
  };

  const parseTarget = (href) => {
    try {
      const url = new URL(href, window.location.href);
      return url;
    } catch (error) {
      return null;
    }
  };

  const updateScrollState = () => {
    scrollFrame = 0;

    if (isNavigating) {
      return;
    }

    const state = history.state;
    if (!state || typeof state.idx !== "number") {
      return;
    }

    if (state.scrollY === window.scrollY) {
      return;
    }

    replaceState({ scrollY: window.scrollY });
  };

  const applyNewApp = (nextDoc) => {
    const nextApp = nextDoc.querySelector("#app");
    const currentApp = document.getElementById("app");

    if (!nextApp || !currentApp) {
      throw new Error("Missing #app container.");
    }

    currentApp.replaceWith(nextApp);
    document.title = nextDoc.title || document.title;

    if (nextDoc.documentElement.lang) {
      document.documentElement.lang = nextDoc.documentElement.lang;
    }
  };

  const scrollToTarget = (url, savedScrollY = null) => {
    if (typeof savedScrollY === "number") {
      window.scrollTo({ top: savedScrollY, left: 0, behavior: "auto" });
      return;
    }

    if (url.hash) {
      const anchor = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (anchor) {
        const targetY = anchor.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: targetY, left: 0, behavior: "auto" });
        return;
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  const fetchDocument = async (url) => {
    const response = await fetch(url.toString(), { credentials: "same-origin" });
    if (!response.ok) {
      throw new Error(`Navigation failed with status ${response.status}.`);
    }

    const html = await response.text();
    return new DOMParser().parseFromString(html, "text/html");
  };

  const runSwap = async ({ nextDoc, direction, url, savedScrollY = null }) => {
    document.documentElement.dataset.navDirection = direction;

    const commit = () => {
      applyNewApp(nextDoc);
      // Set the target scroll position during the DOM swap so the new view
      // starts at the correct position instead of jumping after the transition.
      scrollToTarget(url, savedScrollY);
    };

    if (hasViewTransitions()) {
      const transition = document.startViewTransition(commit);
      try {
        await transition.finished;
      } catch (error) {
        // Ignore aborted transitions and keep navigation functional.
      }
    } else {
      commit();
    }

    delete document.documentElement.dataset.navDirection;
    if (typeof window.initMalpauseUI === "function") {
      window.initMalpauseUI();
    }

    replaceState({ scrollY: window.scrollY });
  };

  const navigate = async ({
    url,
    direction = "forward",
    mode = "push",
    stateScrollY = null,
    forcedIndex = null,
  }) => {
    if (isNavigating) {
      return;
    }

    isNavigating = true;

    try {
      const nextDoc = await fetchDocument(url);
      const targetPage = getPageFile(url.pathname);

      if (mode === "push") {
        const nextIndex = typeof forcedIndex === "number" ? forcedIndex : currentIndex + 1;
        history.pushState(
          { router: true, idx: nextIndex, page: targetPage, scrollY: 0 },
          "",
          url.toString(),
        );
        currentIndex = nextIndex;
      } else if (mode === "replace") {
        const nextIndex = typeof forcedIndex === "number" ? forcedIndex : currentIndex;
        history.replaceState(
          { router: true, idx: nextIndex, page: targetPage, scrollY: stateScrollY ?? 0 },
          "",
          url.toString(),
        );
        currentIndex = nextIndex;
      }

      await runSwap({ nextDoc, direction, url, savedScrollY: stateScrollY });
    } catch (error) {
      window.location.href = url.toString();
    } finally {
      isNavigating = false;
    }
  };

  const handlePopState = async (event) => {
    if (!isAllowedUrl(new URL(window.location.href))) {
      return;
    }

    const targetState =
      event.state && typeof event.state === "object" ? event.state : {};

    if (!targetState.router) {
      return;
    }

    const targetIndex = typeof targetState.idx === "number" ? targetState.idx : currentIndex;
    const targetPage = getPageFile(window.location.pathname);
    const indexDirection = targetIndex < currentIndex ? "back" : "forward";
    const direction = resolveDirection(activePage(), targetPage, indexDirection);

    currentIndex = targetIndex;

    await navigate({
      url: new URL(window.location.href),
      direction,
      mode: "none",
      stateScrollY: typeof targetState.scrollY === "number" ? targetState.scrollY : null,
    });
  };

  const handleBackLink = async (linkUrl) => {
    const state = history.state && typeof history.state === "object" ? history.state : {};
    const localIdx = typeof state.idx === "number" ? state.idx : 0;

    if (localIdx > 0) {
      history.back();
      return;
    }

    await navigate({
      url: linkUrl,
      direction: "back",
      mode: "replace",
      forcedIndex: 0,
      stateScrollY: 0,
    });
  };

  const handleLinkClick = async (event) => {
    const link = event.target.closest("a[href]");
    if (!link || shouldSkipLink(event, link)) {
      return;
    }

    const targetUrl = parseTarget(link.getAttribute("href"));
    if (!targetUrl || targetUrl.origin !== window.location.origin) {
      return;
    }

    const currentUrl = new URL(window.location.href);
    const targetPage = getPageFile(targetUrl.pathname);
    const currentPageFile = getPageFile(currentUrl.pathname);
    const isSameDocument =
      targetPage === currentPageFile && targetUrl.search === currentUrl.search;

    if (isSameDocument && targetUrl.hash) {
      return;
    }

    if (!isAllowedUrl(targetUrl)) {
      return;
    }

    event.preventDefault();
    replaceState({ scrollY: window.scrollY });

    const direction = resolveDirection(activePage(), targetPage, "forward");

    if (link.hasAttribute("data-back")) {
      await handleBackLink(targetUrl);
      return;
    }

    await navigate({ url: targetUrl, direction, mode: "push" });
  };

  if (!isAllowedUrl(new URL(window.location.href))) {
    return;
  }

  history.scrollRestoration = "manual";
  replaceState({
    idx:
      history.state && typeof history.state.idx === "number" ? history.state.idx : 0,
    page: currentPage(),
    scrollY:
      history.state && typeof history.state.scrollY === "number"
        ? history.state.scrollY
        : window.scrollY,
  });
  currentIndex = history.state.idx;

  window.addEventListener("click", handleLinkClick);
  window.addEventListener("popstate", handlePopState);
  window.addEventListener(
    "scroll",
    () => {
      if (scrollFrame) {
        return;
      }
      scrollFrame = window.requestAnimationFrame(updateScrollState);
    },
    { passive: true },
  );
})();
