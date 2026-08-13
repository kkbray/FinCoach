(() => {
  const queue = [];
  const config = window.FINCOACH_ANALYTICS || {};
  const provider = (config.provider || "queue").toLowerCase();

  function push(event, props = {}) {
    const payload = {
      event,
      props,
      path: location.pathname + location.search + location.hash,
      title: document.title,
      ts: new Date().toISOString(),
    };
    queue.push(payload);
    window.__fincoachAnalyticsQueue = queue;

    if (provider === "plausible" && window.plausible) {
      window.plausible(event, { props });
    }

    if (provider === "posthog" && window.posthog) {
      window.posthog.capture(event, props);
    }
  }

  window.fincoachTrack = push;
  window.__fincoachAnalyticsQueue = queue;

  document.addEventListener("click", (event) => {
    const target = event.target.closest(
      "[data-route], [data-complete], [data-auth-route], [data-auth-action], [data-demo-scenario], [data-goal-edit], [data-budget-edit], [data-reminder-view], [data-notification-toggle], [data-notification-permission]",
    );
    if (!target) return;

    push("ui_click", {
      action: target.dataset.route || target.dataset.complete || target.dataset.authRoute || target.dataset.authAction || target.dataset.demoScenario || target.dataset.goalEdit || target.dataset.budgetEdit || target.dataset.reminderView || target.dataset.notificationToggle || target.dataset.notificationPermission || "unknown",
      label: (target.textContent || "").trim().slice(0, 80),
    });
  }, true);

  const titleEl = document.querySelector("#screen-title");
  if (titleEl) {
    const observer = new MutationObserver(() => {
      push("screen_view", { screen: titleEl.textContent.trim() });
    });
    observer.observe(titleEl, { childList: true, characterData: true, subtree: true });
    push("screen_view", { screen: titleEl.textContent.trim() });
  }

  push("prototype_loaded", { provider });
})();
