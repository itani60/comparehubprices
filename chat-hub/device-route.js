(function () {
  const ua = navigator.userAgent || "";
  const isPhone = /iPhone|iPod|Android.*Mobile|Windows Phone|IEMobile|Opera Mini|BlackBerry|BB10|webOS/i.test(ua);
  const isTabletUA = /iPad|Tablet|PlayBook|Silk|Kindle|Android(?!.*Mobile)/i.test(ua);
  const isIpadDesktop = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  const width = window.innerWidth || document.documentElement.clientWidth || 0;
  const height = window.innerHeight || document.documentElement.clientHeight || 0;
  const screenWidth = window.screen?.width || 0;
  const screenHeight = window.screen?.height || 0;
  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);
  const screenShort = Math.min(screenWidth, screenHeight);
  const screenLong = Math.max(screenWidth, screenHeight);
  const minTablet = 768;
  const maxTablet = 1440;
  const isTabletSize =
    (shortSide >= minTablet && longSide <= maxTablet) ||
    (screenShort >= minTablet && screenLong <= maxTablet);
  const isCoarsePointer = window.matchMedia
    ? window.matchMedia("(pointer: coarse)").matches
    : false;
  const isTablet = !isPhone && (isTabletUA || isIpadDesktop || (isTabletSize && isCoarsePointer));
  const { pathname, search, hash } = window.location;
  const isDesktopEntry = /index-desktop\.html$/i.test(pathname);
  const isTabletEntry = /index-tablet\.html$/i.test(pathname);
  const isMobileEntry = /index\.html$/i.test(pathname);
  const hasExplicitFile = /\.[a-z0-9]+$/i.test(pathname.split("/").pop() || "");
  const indexPattern = /index(?:-desktop|-tablet)?\.html$/i;

  function resolveTarget(entryName) {
    if (indexPattern.test(pathname)) {
      return pathname.replace(indexPattern, entryName);
    }
    if (pathname.endsWith("/")) {
      return pathname + entryName;
    }
    if (!hasExplicitFile) {
      return pathname + "/" + entryName;
    }
    return null;
  }

  const desiredEntry = isPhone ? "index.html" : isTablet ? "index-tablet.html" : "index-desktop.html";
  const alreadyOnEntry =
    (desiredEntry === "index.html" && isMobileEntry) ||
    (desiredEntry === "index-tablet.html" && isTabletEntry) ||
    (desiredEntry === "index-desktop.html" && isDesktopEntry);

  if (alreadyOnEntry) {
    return;
  }

  const target = resolveTarget(desiredEntry);
  if (target && target !== pathname) {
    window.location.replace(target + search + hash);
  }
})();
