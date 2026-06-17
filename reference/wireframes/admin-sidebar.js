(function () {
  const shell = document.querySelector(".wf-admin-shell");
  if (!shell) return;

  const sidebar = document.getElementById("admin-sidebar");
  const openBtn = document.querySelector("[data-admin-menu-open]");
  const closeBtn = document.querySelector("[data-admin-menu-close]");
  const overlay = document.querySelector("[data-admin-overlay]");
  const mobileQuery = window.matchMedia("(max-width: 899px)");

  function openSidebar() {
    shell.classList.add("is-sidebar-open");
    openBtn?.setAttribute("aria-expanded", "true");
    if (mobileQuery.matches) {
      document.body.style.overflow = "hidden";
    }
  }

  function closeSidebar() {
    shell.classList.remove("is-sidebar-open");
    openBtn?.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  openBtn?.addEventListener("click", openSidebar);
  closeBtn?.addEventListener("click", closeSidebar);
  overlay?.addEventListener("click", closeSidebar);

  sidebar?.querySelectorAll(".wf-admin-nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      if (mobileQuery.matches) closeSidebar();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSidebar();
  });

  mobileQuery.addEventListener("change", (event) => {
    if (!event.matches) closeSidebar();
  });
})();
