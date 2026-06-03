const tooltip = document.getElementById("flow-tooltip");

function moveTooltip(event) {
  const offset = 14;
  const tooltipRect = tooltip.getBoundingClientRect();
  let left = event.clientX + offset;
  let top = event.clientY + offset;

  if (left + tooltipRect.width > window.innerWidth - 12) {
    left = event.clientX - tooltipRect.width - offset;
  }

  if (top + tooltipRect.height > window.innerHeight - 12) {
    top = event.clientY - tooltipRect.height - offset;
  }

  tooltip.style.left = `${Math.max(12, left)}px`;
  tooltip.style.top = `${Math.max(12, top)}px`;
}

document.addEventListener("mousemove", (event) => {
  const target = event.target.closest("[data-detail]");

  if (!target) {
    tooltip.classList.remove("is-visible");
    return;
  }

  tooltip.textContent = target.dataset.detail;
  tooltip.classList.add("is-visible");
  moveTooltip(event);
});

document.addEventListener("mouseleave", () => {
  tooltip.classList.remove("is-visible");
});
