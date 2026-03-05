(function () {
  const ua = navigator.userAgent || "";
  const isPhone = /iPhone|iPod|Android.*Mobile|Windows Phone|IEMobile|Opera Mini|BlackBerry|BB10|webOS/i.test(ua);
  const { pathname, search, hash } = window.location;
  const isDesktopEntry = /index-desktop\.html$/i.test(pathname);
  const hasExplicitFile = /\.[a-z0-9]+$/i.test(pathname.split("/").pop() || "");

  if (isPhone && isDesktopEntry) {
    const target = pathname.replace(/index-desktop\.html$/i, "index.html");
    if (target !== pathname) {
      window.location.replace(target + search + hash);
    }
    return;
  }

  if (!isPhone && !isDesktopEntry) {
    let target = pathname;

    if (/index\.html$/i.test(pathname)) {
      target = pathname.replace(/index\.html$/i, "index-desktop.html");
    } else if (pathname.endsWith("/")) {
      target = pathname + "index-desktop.html";
    } else if (!hasExplicitFile) {
      target = pathname + "/index-desktop.html";
    } else {
      return;
    }

    if (target !== pathname) {
      window.location.replace(target + search + hash);
    }
  }
})();
