const user = {
  id: "u_001",
  name: "Kyle",
  preferredName: "Kyle",
  lastActiveAt: "2026-05-15T08:45:00",
};

const state = {
  route: "home",
  lastRoute: "home",
  completedActions: [],
  transferApplied: false,
  pinnedCardIds: ["bill-pressure", "hidden-savings"],
  demoScenario: "auto",
  coachMessages: [
    {
      from: "coach",
      text: "Ask me what matters now, why I recommended an action, or which lesson can help.",
    },
  ],
  wins: [
    { id: "w1", title: "Reviewed Friday rent", date: "May 14", source: "money move" },
    { id: "w2", title: "Skipped impulse lunch order", date: "May 13", source: "manual" },
    { id: "w3", title: "Moved spare buffer to savings", date: "May 12", source: "money move" },
  ],
};

const accounts = [
  { id: "a1", name: "Everyday Checking", type: "checking", balance: 1184, availableBalance: 1184 },
  { id: "a2", name: "Safety Buffer", type: "savings", balance: 720, availableBalance: 720 },
  { id: "a3", name: "Rewards Card", type: "credit", balance: -214, availableBalance: 1786 },
];

const bills = [
  { id: "b1", name: "Rent", amount: 1226, dueDate: "Friday", status: "upcoming", isEssential: true },
  { id: "b2", name: "Electric", amount: 86, dueDate: "Monday", status: "upcoming", isEssential: true },
  { id: "b3", name: "Phone", amount: 54, dueDate: "May 24", status: "scheduled", isEssential: true },
  { id: "b4", name: "Streaming Bundle", amount: 22, dueDate: "May 28", status: "upcoming", isEssential: false },
];

const transactions = [
  { id: "t1", merchant: "Fresh Market", amount: -38.42, category: "Groceries", date: "Today", reviewed: true },
  { id: "t2", merchant: "Blue Bottle", amount: -6.8, category: "Dining", date: "Yesterday", reviewed: true },
  { id: "t3", merchant: "RideShare", amount: -18.25, category: "Transport", date: "Yesterday", reviewed: false },
  { id: "t4", merchant: "Paycheck", amount: 980, category: "Income", date: "May 13", reviewed: true },
  { id: "t5", merchant: "Streamly", amount: -22, category: "Subscriptions", date: "May 12", reviewed: false },
];

const categories = [
  { id: "c1", name: "Groceries", spent: 248, target: 300 },
  { id: "c2", name: "Dining", spent: 126, target: 140 },
  { id: "c3", name: "Transport", spent: 82, target: 160 },
];

const goals = [
  { id: "g1", name: "Emergency buffer", currentAmount: 720, targetAmount: 1200 },
  { id: "g2", name: "Move-in cushion", currentAmount: 310, targetAmount: 900 },
];

function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function deriveFinancialSnapshot() {
  const checking = accounts.find((account) => account.type === "checking").availableBalance;
  const essentialBills = bills
    .filter((bill) => bill.isEssential && ["upcoming", "scheduled"].includes(bill.status))
    .reduce((sum, bill) => sum + bill.amount, 0);
  const safeToSpend = checking - essentialBills;
  const unreadAlerts = transactions.filter((transaction) => !transaction.reviewed).length;
  const tight = safeToSpend < 0;
  const categoryPressure = categories.map((category) => ({
    ...category,
    ratio: category.spent / category.target,
    pressure: category.spent / category.target > 0.85 ? "high" : category.spent / category.target > 0.7 ? "medium" : "low",
  }));

  return {
    financialState: tight ? "tight" : safeToSpend > 150 ? "stable" : "watching",
    billPressure: tight ? "high" : safeToSpend < 150 ? "medium" : "low",
    safeToSpend,
    unreadAlerts,
    streakDays: state.wins.length + state.completedActions.length,
    categoryPressure,
  };
}

function applyDemoScenario(snapshot) {
  const scenario = state.demoScenario;
  if (scenario === "fraud") {
    return {
      ...snapshot,
      financialState: "tight",
      billPressure: "high",
      alertMode: "fraud",
    };
  }
  if (scenario === "overdraft") {
    return {
      ...snapshot,
      financialState: "tight",
      billPressure: "high",
      safeToSpend: -47,
      alertMode: "overdraft",
    };
  }
  if (scenario === "bill-heavy") {
    return {
      ...snapshot,
      financialState: "tight",
      billPressure: "high",
      alertMode: "bill-heavy",
    };
  }
  if (scenario === "buffer-watch") {
    return {
      ...snapshot,
      financialState: "watching",
      billPressure: "medium",
      alertMode: "buffer-watch",
    };
  }
  if (scenario === "growth") {
    return {
      ...snapshot,
      financialState: "stable",
      billPressure: "low",
      safeToSpend: snapshot.safeToSpend + 140,
      alertMode: "growth",
    };
  }
  return snapshot;
}

function coachMessage(snapshot) {
  const scenario = state.demoScenario;
  if (scenario === "fraud") {
    return {
      title: "Possible fraud needs a quick review.",
      copy: "I spotted a charge that does not match your usual pattern. Review it now to stay ahead of risk.",
      label: "Fraud alert",
    };
  }

  if (scenario === "overdraft") {
    return {
      title: "Your checking may dip below zero soon.",
      copy: "The timing looks tight. Here are a couple of ways to protect the account before damage happens.",
      label: "Overdraft risk",
    };
  }

  if (scenario === "bill-heavy") {
    return {
      title: `${user.preferredName}, this is a bill-heavy week.`,
      copy: "I found a few ways to create breathing room before rent. Tap this space to ask why.",
      label: "Bill pressure high",
    };
  }

  if (scenario === "buffer-watch") {
    return {
      title: "Your bills are covered. Let's protect the buffer.",
      copy: "A quick timing check and one savings scan can keep the week steady.",
      label: "Buffer watch",
    };
  }

  if (scenario === "growth") {
    return {
      title: "You have room to make progress.",
      copy: `Bills are covered and ${currency(snapshot.safeToSpend)} is safe-to-spend. Want to build cushion?`,
      label: "Stable cash flow",
    };
  }

  if (snapshot.financialState === "tight") {
    return {
      title: `${user.preferredName}, this is a bill-heavy week.`,
      copy: `I found a few ways to create breathing room before rent. Tap this space to ask why.`,
      label: "Bill pressure high",
    };
  }

  if (snapshot.financialState === "watching") {
    return {
      title: "Your bills are covered. Let's protect the buffer.",
      copy: "A quick timing check and one savings scan can keep the week steady.",
      label: "Buffer watch",
    };
  }

  return {
    title: "You have room to make progress.",
    copy: `Bills are covered and ${currency(snapshot.safeToSpend)} is safe-to-spend. Want to build cushion?`,
    label: "Stable cash flow",
  };
}

function heroVariant(snapshot) {
  const scenario = state.demoScenario;
  if (scenario === "fraud") return "fraud";
  if (scenario === "overdraft") return "overdraft";
  if (snapshot.billPressure === "high" || snapshot.financialState === "tight") return "critical";
  if (snapshot.financialState === "watching") return "watching";
  return "stable";
}

function recommendedActions(snapshot) {
  const scenario = state.demoScenario;
  if (scenario === "fraud") {
    return [
      { label: "Review charge", route: "transactions" },
      { label: "Contact bank", route: "accounts" },
    ];
  }

  if (scenario === "overdraft") {
    return [
      { label: "Protect balance", route: "paydays" },
      { label: "Find breathing room", route: "hidden-savings" },
    ];
  }

  if (snapshot.billPressure === "high") {
    return [
      { label: "Create breathing room", route: "hidden-savings" },
      { label: "Protect bills", route: "paydays" },
    ];
  }

  if (snapshot.financialState === "watching") {
    return [
      { label: "Keep buffer steady", route: "paydays" },
      { label: "Find hidden savings", route: "hidden-savings" },
    ];
  }

  return [
    { label: "Build cushion", route: "savings" },
    { label: "Find hidden savings", route: "hidden-savings" },
    { label: "Review goals", route: "goals" },
  ];
}

function contextCards(snapshot) {
  const highCategory = snapshot.categoryPressure.find((category) => category.pressure === "high");
  const cards = [
    {
      id: "overspending-watch",
      visual: "speedometer",
      value: currency(snapshot.safeToSpend),
      type: "Overspending watch",
      title: "Safe-to-spend",
      description: "What is left after essentials and near-term pressure.",
      route: "bills",
    },
    {
      id: "pending-transactions",
      visual: "briefing",
      value: `${transactions.filter((transaction) => !transaction.reviewed).length} items`,
      type: "Pending transactions",
      title: "Needs review",
      description: "Recent spending that still needs a quick look.",
      route: "transactions",
    },
    {
      id: "low-balance-guard",
      visual: "save",
      value: currency(snapshot.totalBalance),
      type: "Low balance guard",
      title: "Overdraft watch",
      description: "Balance risk before the next bill and payday shift.",
      route: "paydays",
    },
  ];

  if (highCategory) {
    cards.push({
      id: "category",
      visual: "target",
      value: currency(highCategory.target - highCategory.spent),
      type: "Category pressure",
      title: `${highCategory.name} pressure`,
      description: `${highCategory.name} has this much room left.`,
      route: "insights",
    });
  }

  cards.push({
    id: "suspicious-activity",
    visual: "credit",
    value: "Alert",
    type: "Suspicious activity",
    title: "Fraud watch",
    description: "Unusual spending patterns deserve attention before the next refresh.",
    route: "insights",
  });

  cards.push({
    id: "hidden-savings",
    visual: "spark",
    value: "$100",
    type: "Auto-save opportunity",
    title: "Breathing room scan",
    description: "Small timing and spend moves that may create extra cushion.",
    route: "hidden-savings",
  });

  return cards.slice(0, 5);
}

function getPinnedCards(cards) {
  return state.pinnedCardIds
    .map((id) => cards.find((card) => card.id === id))
    .filter(Boolean);
}

function getUnpinnedCards(cards) {
  return cards.filter((card) => !state.pinnedCardIds.includes(card.id));
}

const savingsOpportunities = [
  { title: "Round up spare change", description: "Sweep small transaction roundups into the buffer.", impact: "~$25/mo" },
  { title: "Pause one subscription", description: "Review the streaming bundle before it renews.", impact: "$22" },
  { title: "Move leftover bill buffer", description: "After electric clears, move unused cushion to savings.", impact: "~$15" },
];

const moneyMoves = [
  { title: "Cover the rent gap", reason: "Prevents the week from starting short.", route: "move-savings", priority: "High" },
  { title: "Categorize two transactions", reason: "Improves category pressure recommendations.", route: "transactions", priority: "Medium" },
  { title: "Review streaming bundle", reason: "Could free cash before the next bill cycle.", route: "subscription-review", priority: "Low" },
];

const sponsoredOffers = [
  {
    id: "s1",
    sponsor: "FreshCart",
    title: "Save $15 on groceries",
    description: "Relevant because grocery pressure is high.",
    code: "BUFFER15",
    accent: "green",
    route: "offer-detail",
  },
  {
    id: "s2",
    sponsor: "RideLoop",
    title: "Cut ride costs",
    description: "20% off rides before payday.",
    code: "MOVE20",
    accent: "blue",
    route: "offer-detail",
  },
  {
    id: "s3",
    sponsor: "MealNest",
    title: "$8 meal credit",
    description: "Useful when dining is near target.",
    code: "CALM8",
    accent: "amber",
    route: "offer-detail",
  },
];

const app = document.querySelector("#app");
const screenTitle = document.querySelector("#screen-title");

function setRoute(route) {
  state.lastRoute = state.route;
  state.route = route;
  render();
}

function render() {
  try {
    const snapshot = deriveFinancialSnapshot();
    const demoSnapshot = applyDemoScenario(snapshot);
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.route === normalizeNavRoute(state.route));
    });

    const routes = {
      home: () => renderHome(demoSnapshot),
      budgets: () => renderBudgets(snapshot),
      bills: () => renderBills(snapshot),
      transactions: () => renderTransactions(),
      categorization: () => renderCategorization(),
      paydays: () => renderPaydays(snapshot),
      savings: () => renderSavings(),
      "wins-log": () => renderWinsLog(snapshot),
      insights: () => renderInsights(snapshot),
      accounts: () => renderAccounts(),
      "cash-flow": () => renderCashFlow(snapshot),
      goals: () => renderGoals(),
      workflows: () => renderWorkflows(demoSnapshot),
      reports: () => renderReports(snapshot),
      settings: () => renderSettings(),
      "coach-chat": () => renderCoachChat(demoSnapshot),
      "stocks-waitlist": () => renderStocksWaitlist(),
      "offer-detail": () => renderOfferDetail(),
      "hidden-savings": () => renderHiddenSavings(demoSnapshot),
      "log-win": () => renderLogWin(),
      "move-savings": () => renderMoveSavings(snapshot),
      "subscription-review": () => renderSubscriptionReview(),
      "add-funds": () => renderAddFunds(),
    };

    app.innerHTML = (routes[state.route] || routes.home)();
    bindRouteButtons();
    app.scrollTop = 0;
  } catch (error) {
    screenTitle.textContent = "Prototype";
    app.innerHTML = `
      <article class="section-card">
        <h2>Let's reset the view</h2>
        <p>The prototype hit a temporary display issue. Your fake data is still here.</p>
        <button class="cta" type="button" data-route="home">Return home</button>
      </article>
    `;
    bindRouteButtons();
    console.error(error);
  }
}

function normalizeNavRoute(route) {
  if (["budgets", "bills", "transactions", "categorization", "paydays"].includes(route)) return "budgets";
  if (route === "accounts") return "accounts";
  if (["reports", "insights", "cash-flow", "goals"].includes(route)) return "insights";
  if (["workflows", "coach-chat", "hidden-savings", "log-win", "move-savings", "subscription-review", "stocks-waitlist"].includes(route)) return "workflows";
  if (route === "settings") return "settings";
  return "home";
}

function bindRouteButtons() {
  app.querySelectorAll("[data-hero-route]").forEach((hero) => {
    hero.addEventListener("click", (event) => {
      if (event.target.closest("button, input, form")) return;
      setRoute(hero.dataset.heroRoute);
    });
  });

  app.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => setRoute(button.dataset.route));
  });

  app.querySelectorAll("[data-complete]").forEach((button) => {
    button.addEventListener("click", () => {
      completeAction(button.dataset.complete);
      setRoute(button.dataset.next || "home");
    });
  });

  app.querySelectorAll("[data-demo-scenario]").forEach((button) => {
    button.addEventListener("click", () => {
      state.demoScenario = button.dataset.demoScenario;
      render();
    });
  });

  app.querySelectorAll("[data-pin-card]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const cardId = button.dataset.pinCard;
      if (state.pinnedCardIds.includes(cardId)) {
        state.pinnedCardIds = state.pinnedCardIds.filter((id) => id !== cardId);
      } else {
        state.pinnedCardIds = [cardId, ...state.pinnedCardIds].slice(0, 4);
      }
      render();
    });
  });

  const coachForm = app.querySelector("[data-coach-form]");
  if (coachForm) {
    coachForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = coachForm.querySelector("input");
      const question = input.value.trim();
      if (!question) return;
      state.coachMessages.push({ from: "user", text: question });
      state.coachMessages.push({ from: "coach", text: coachReply(question) });
      input.value = "";
      if (coachForm.dataset.nextRoute) {
        setRoute(coachForm.dataset.nextRoute);
        return;
      }
      render();
    });
  }
}

function completeAction(label) {
  state.completedActions.push(label);

  if (label.includes("Logged today's win")) {
    state.wins.unshift({
      id: `w${Date.now()}`,
      title: "Logged today's money win",
      date: "Today",
      source: "manual",
    });
  }

  if ((label.includes("Moved $50") || label.includes("Added $50")) && !state.transferApplied) {
    const checking = accounts.find((account) => account.type === "checking");
    const savings = accounts.find((account) => account.type === "savings");
    checking.balance += 50;
    checking.availableBalance += 50;
    savings.balance -= 50;
    savings.availableBalance -= 50;
    state.transferApplied = true;
  }
}

function renderHome(snapshot) {
  const coach = coachMessage(snapshot);
  const cards = contextCards(snapshot);
  const pinnedCards = getPinnedCards(cards);
  const otherCards = getUnpinnedCards(cards);
  const heroClass = heroVariant(snapshot);
  screenTitle.textContent = "Today";

  return `
    <article class="coach-hero ${heroClass}" data-hero-route="coach-chat" role="button" tabindex="0" aria-label="Open FinCoach chat">
      <div class="hero-top">
        <span class="state-pill ${heroClass}"><span class="state-dot"></span>${coach.label}</span>
        <h2 class="hero-title">${coach.title}</h2>
        <p class="hero-copy">${coach.copy}</p>
        ${heroClass === "critical" || heroClass === "fraud" || heroClass === "overdraft" ? "" : `
        <div class="safe-spend">
          <div class="dial"><div class="dial-inner">${currency(snapshot.safeToSpend)}</div></div>
          <div>
            <p class="safe-label">Estimated safe-to-spend</p>
            <p class="safe-detail">After upcoming essentials and current buffer pressure.</p>
          </div>
        </div>`}
      </div>
      <div class="hero-actions">
        ${heroStrategies(snapshot).map((strategy) => `<button class="coach-action strategy-action" type="button" data-route="${strategy.route}">${strategy.label}</button>`).join("")}
      </div>
    </article>

    <div class="action-row">
      ${secondaryChip("Categorize", "categorization", "C")}
      ${secondaryChip("Goals", "goals", "G")}
      ${secondaryChip("Bills", "paydays", "B")}
      ${secondaryChip("Recent", "transactions", "R")}
    </div>

    <div class="section-title">
      <h2>Pinned context</h2>
      <p>Tap pin to keep on screen</p>
    </div>
    <div class="context-grid">
      ${pinnedCards.map(renderContextCard).join("")}
    </div>

    <div class="section-title">
      <h2>More context</h2>
      <p>Swipe for the rest</p>
    </div>
    <div class="context-rail">
      ${otherCards.map(renderContextCard).join("")}
    </div>

    <div class="section-title sponsored-title">
      <h2>Sponsored savings</h2>
      <p>Offers</p>
    </div>
    <div class="sponsor-rail">
      ${sponsoredOffers.map(renderSponsoredOffer).join("")}
    </div>
  `;
}

function secondaryChip(label, route, icon) {
  return `<button class="chip" type="button" data-route="${route}"><span aria-hidden="true">${icon}</span><span>${label}</span></button>`;
}

function renderContextCard(card) {
  const isPinned = state.pinnedCardIds.includes(card.id);
  return `
    <div class="context-card visual-card ${card.visual}" role="button" tabindex="0" data-route="${card.route}">
      <button class="pin-toggle ${isPinned ? "is-pinned" : ""}" type="button" data-pin-card="${card.id}" aria-label="${isPinned ? "Unpin" : "Pin"} ${card.title}">
        ${isPinned ? "Pinned" : "Pin"}
      </button>
      <span class="card-visual" aria-hidden="true">${renderCardVisual(card)}</span>
      <span class="card-copy">
        <p class="card-type">${card.type}</p>
        <h3>${card.title}</h3>
        <strong>${card.value}</strong>
        <p>${card.description}</p>
      </span>
      <span class="arrow" aria-hidden="true">?</span>
    </div>
  `;
}

function heroStrategies(snapshot) {
  const scenario = state.demoScenario;
  if (scenario === "fraud") {
    return [
      { label: "Review suspicious charge", route: "transactions" },
      { label: "Secure accounts", route: "accounts" },
    ];
  }
  if (scenario === "overdraft") {
    return [
      { label: "Protect balance", route: "paydays" },
      { label: "Find $50 buffer", route: "hidden-savings" },
    ];
  }
  if (scenario === "bill-heavy") {
    return [
      { label: "Shield bills", route: "paydays" },
      { label: "Move funds safely", route: "move-savings" },
    ];
  }
  if (scenario === "buffer-watch") {
    return [
      { label: "Keep buffer steady", route: "savings" },
      { label: "Check cash timing", route: "cash-flow" },
    ];
  }
  if (scenario === "growth") {
    return [
      { label: "Build cushion", route: "savings" },
      { label: "Push goal progress", route: "goals" },
    ];
  }
  return [
    { label: "Build cushion", route: "savings" },
    { label: "Review goals", route: "goals" },
  ];
}

function renderCardVisual(card) {
  if (card.visual === "speedometer") {
    return `<span class="mini-gauge"><span class="gauge-needle"></span><span class="gauge-value">${card.value}</span></span>`;
  }

  if (card.visual === "briefing") {
    return `<span class="briefing-art"><span class="sun-dot"></span><span class="note-lines"></span></span>`;
  }

  if (card.visual === "target") {
    return `<span class="target-art"><span></span></span>`;
  }

  if (card.visual === "clock") {
    return `<span class="clock-art"><span></span></span>`;
  }

  if (card.visual === "spark") {
    return `<span class="spark-art"><span></span></span>`;
  }

  if (card.visual === "save") {
    return `<span class="save-art"><span></span></span>`;
  }

  if (card.visual === "credit") {
    return `<span class="credit-art"><span></span></span>`;
  }

  return `<span class="momentum-art"><span></span></span>`;
}

function renderSponsoredOffer(offer) {
  return `
    <button class="sponsor-card ${offer.accent}" type="button" data-route="${offer.route}">
      <span class="sponsor-label">Sponsored</span>
      <span class="sponsor-brand">${offer.sponsor}</span>
      <strong>${offer.title}</strong>
      <span class="sponsor-copy">${offer.description}</span>
      <span class="coupon-row">
        <span>Relevant this week</span>
        <span>View offer</span>
      </span>
    </button>
  `;
}

function renderOfferDetail() {
  screenTitle.textContent = "Offer";
  return `
    ${screenHeading("Sponsored offer", "Mock sponsorship space for coupons, discounts, and partner savings.")}
    <article class="coupon-detail">
      <p class="sponsor-label">Sponsored</p>
      <h3>Save on a planned purchase</h3>
      <p>This prototype shows how FinCoach could support partner-funded offers without mixing them into AI recommendations.</p>
      <div class="coupon-code">BUFFER15</div>
      <button class="cta" type="button" data-route="home">Back to dashboard</button>
    </article>
  `;
}

function coachReply(question) {
  const lower = question.toLowerCase();
  if (lower.includes("100") || lower.includes("hidden") || lower.includes("find") || lower.includes("save")) {
    return "I found a possible $100 in breathing room: $22 from a subscription pause, $30 from dining guardrails, $15 from a grocery offer, $18 from transport timing, and $15 from moving leftover bill buffer after electric clears.";
  }

  if (lower.includes("why") || lower.includes("rent") || lower.includes("bill")) {
    return "The main pressure is timing: rent and electric arrive before your buffer fully rebuilds. The lowest-stress path is to cover the rent gap first, then review flexible spending after essentials are safe.";
  }

  if (lower.includes("savings")) {
    return "A small savings action is useful only after the near-term bills are protected. Today, I would keep the move small: $10-$50, then revisit after Friday.";
  }

  if (lower.includes("learn") || lower.includes("lesson")) {
    return "A helpful lesson here is buffer before budget: when cash timing is tight, a small liquid cushion matters more than perfect category tracking.";
  }

  return "What matters now is reducing surprise. I would first protect the upcoming bill, then clear the two transactions that are making the forecast less certain.";
}

function renderCoachChat(snapshot) {
  const coach = coachMessage(snapshot);
  screenTitle.textContent = "FinCoach";
  return `
    ${screenHeading("Ask FinCoach", "A calm coaching prompt for what matters now, why it matters, and what to do next.")}
    <article class="coach-chat-summary">
      <p class="card-type">${coach.label}</p>
      <h3>${coach.title}</h3>
      <p>${coach.copy}</p>
      <div class="quick-links">
        <button class="cta secondary" type="button" data-route="workflows">Recommended money moves</button>
        <button class="cta secondary" type="button" data-route="move-savings">Suggested action</button>
        <button class="cta secondary" type="button" data-route="cash-flow">Financial rationale</button>
        <button class="cta secondary" type="button" data-route="insights">Related lesson</button>
        <button class="cta secondary" type="button" data-route="stocks-waitlist">Join stock waitlist</button>
      </div>
    </article>
    <div class="coach-thread">
      ${state.coachMessages.map((message) => `
        <div class="coach-bubble ${message.from === "user" ? "user-bubble" : ""}">
          <p>${message.text}</p>
        </div>
      `).join("")}
    </div>
    <form class="coach-prompt" data-coach-form>
      <input aria-label="Ask FinCoach" placeholder="Ask why this matters..." />
      <button type="submit">Ask</button>
    </form>
  `;
}

function hiddenSavingsItems() {
  return [
    { title: "Pause streaming bundle", amount: 22, route: "subscription-review", detail: "Renews May 28 and is non-essential this week." },
    { title: "Dining guardrail", amount: 30, route: "budgets", detail: "Dining is close to target; a small cap preserves the buffer." },
    { title: "Grocery partner offer", amount: 15, route: "offer-detail", detail: "Sponsored coupon can offset planned grocery spend." },
    { title: "Transport timing", amount: 18, route: "transactions", detail: "Shift one rideshare trip to transit or delay it." },
    { title: "Leftover bill buffer", amount: 15, route: "cash-flow", detail: "Move unused cushion after electric clears." },
  ];
}

function renderHiddenSavings(snapshot) {
  screenTitle.textContent = "Hidden Savings";
  const items = hiddenSavingsItems();
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  return `
    ${screenHeading("Hidden Savings Scan", "FinCoach found realistic breathing room from bills, categories, timing, and offers.")}
    <article class="hidden-savings-hero">
      <p class="card-type">Potential breathing room</p>
      <h3>${currency(total)}</h3>
      <p>These are not judgments. They are small optional moves you can review one at a time.</p>
      <button class="cta" type="button" data-route="coach-chat">Ask why these moves</button>
    </article>
    ${items.map((item) => `
      <article class="list-card savings-scan-item">
        <span>
          <h3>${item.title}</h3>
          <p>${item.detail}</p>
        </span>
        <strong>${currency(item.amount)}</strong>
        <button class="cta secondary" type="button" data-route="${item.route}">Review</button>
      </article>
    `).join("")}
  `;
}
function renderSavingsBlock() {
  return `
    <section class="section-card">
      <div class="section-title"><h2>Savings Opportunities</h2><p>1-5 items</p></div>
      ${savingsOpportunities.map((item) => `
        <div class="list-item">
          <span><strong>${item.title}</strong><small>${item.description}</small></span>
          <span class="impact">${item.impact}</span>
        </div>
      `).join("")}
      <button class="cta" type="button" data-route="savings">Adjust savings rule</button>
    </section>
  `;
}

function renderDailyWinsBlock(snapshot) {
  return `
    <section class="section-card">
      <div class="section-title"><h2>Daily Wins</h2><p>${snapshot.streakDays}-day streak</p></div>
      <p>You have been checking in consistently. Log one positive action to keep the pattern visible.</p>
      <button class="cta" type="button" data-route="log-win">Log today's win</button>
    </section>
  `;
}

function renderMoneyMovesBlock() {
  return `
    <section class="section-card">
      <div class="section-title"><h2>Money Moves</h2><p>Prioritized</p></div>
      ${moneyMoves.map((move) => `
        <div class="list-item">
          <span><strong>${move.title}</strong><small>${move.reason}</small></span>
          <button class="cta secondary" type="button" data-route="${move.route}">${move.priority}</button>
        </div>
      `).join("")}
    </section>
  `;
}

function renderBills(snapshot) {
  screenTitle.textContent = "Bills";
  return `
    ${screenHeading("Bills", "Review upcoming bill pressure and choose the next calm action.")}
    <div class="metric-grid">
      ${metric("Bill pressure", snapshot.billPressure)}
      ${metric("Current gap", currency(Math.min(snapshot.safeToSpend, 0)))}
    </div>
    ${bills.map((bill) => `
      <article class="list-card">
        <h3>${bill.name}</h3>
        <p>${bill.dueDate} · ${currency(bill.amount)} · ${bill.status}</p>
        <button class="cta secondary" type="button" data-route="${bill.id === "b1" ? "move-savings" : "cash-flow"}">Review plan</button>
      </article>
    `).join("")}
  `;
}

function renderBudgets(snapshot) {
  screenTitle.textContent = "Budgets";
  const highestPressure = snapshot.categoryPressure
    .slice()
    .sort((a, b) => b.ratio - a.ratio)[0];

  return `
    ${screenHeading("Budgets", "Category budgets with coaching context when a category starts feeling tight.")}
    <div class="metric-grid">
      ${metric("Highest pressure", highestPressure.name)}
      ${metric("Room left", currency(highestPressure.target - highestPressure.spent))}
    </div>
    ${snapshot.categoryPressure.map((category) => `
      <article class="list-card">
        <h3>${category.name}</h3>
        <p>${currency(category.spent)} of ${currency(category.target)} used · ${category.pressure} pressure</p>
        <div class="progress-track"><div class="progress-fill" style="width:${Math.min(category.ratio * 100, 100)}%"></div></div>
        <button class="cta secondary" type="button" data-route="${category.pressure === "high" ? "coach-chat" : "transactions"}">
          ${category.pressure === "high" ? "Ask about this" : "See activity"}
        </button>
      </article>
    `).join("")}
  `;
}

function renderTransactions() {
  screenTitle.textContent = "Transactions";
  return `
    ${screenHeading("Transactions", "Recent activity with just enough review to improve recommendations.")}
    ${transactions.map((transaction) => `
      <article class="list-card">
        <h3>${transaction.merchant}</h3>
        <p>${transaction.date} · ${currency(transaction.amount)} · ${transaction.category}</p>
        <span class="status-badge ${transaction.reviewed ? "" : "attention"}">${transaction.reviewed ? "Reviewed" : "Needs review"}</span>
      </article>
    `).join("")}
    <button class="cta" type="button" data-complete="Categorized recent transactions">Mark review complete</button>
  `;
}

function renderCategorization() {
  screenTitle.textContent = "Categorize";
  const needsReview = transactions.filter((transaction) => !transaction.reviewed);
  return `
    ${screenHeading("Categorization", "Clear uncertain transactions so budgets and coaching recommendations stay useful.")}
    <div class="metric-grid">
      ${metric("Needs review", needsReview.length)}
      ${metric("Categories", categories.length)}
    </div>
    ${needsReview.map((transaction) => `
      <article class="list-card">
        <h3>${transaction.merchant}</h3>
        <p>${transaction.date} · ${currency(transaction.amount)} · Suggested: ${transaction.category}</p>
        <button class="cta secondary" type="button" data-complete="Categorized ${transaction.merchant}" data-next="categorization">Confirm category</button>
      </article>
    `).join("") || `
      <article class="list-card">
        <h3>Everything is categorized</h3>
        <p>No uncertain transactions need review right now.</p>
      </article>
    `}
  `;
}

function renderSavings() {
  screenTitle.textContent = "Savings";
  return `
    ${screenHeading("Savings Plan", "Small automatic moves that build the buffer without creating pressure.")}
    <article class="section-card">
      <h2>Current rule</h2>
      <p>Round up card purchases and sweep the difference every Friday.</p>
      <button class="cta" type="button" data-complete="Adjusted savings rule">Use $10 weekly sweep</button>
    </article>
    ${renderSavingsBlock()}
  `;
}

function renderWinsLog(snapshot) {
  screenTitle.textContent = "Wins";
  return `
    ${screenHeading("Wins Log", "Positive actions compound when they are visible.")}
    <div class="metric-grid">
      ${metric("Current streak", `${snapshot.streakDays} days`)}
      ${metric("Logged wins", state.wins.length)}
    </div>
    ${state.wins.map((win) => `
      <article class="list-card">
        <h3>${win.title}</h3>
        <p>${win.date} · ${win.source}</p>
      </article>
    `).join("")}
    <button class="cta" type="button" data-route="log-win">Log today's win</button>
  `;
}

function renderInsights(snapshot) {
  screenTitle.textContent = "Insights";
  const strongestCategory = snapshot.categoryPressure
    .slice()
    .sort((a, b) => b.ratio - a.ratio)[0];
  const hiddenSavings = snapshot.hiddenSavingsEstimate || 100;
  const recurringCount = transactions.filter((transaction) => transaction.isRecurring).length;
  const uncategorizedCount = transactions.filter((transaction) => !transaction.categoryId).length;
  const highPressureCategories = snapshot.categoryPressure.filter((category) => category.pressure === "high").length;
  return `
    ${screenHeading("Insights", "Patterns explained in plain language, with the next useful action nearby.")}
    <article class="insight-hero section-card">
      <div class="insight-hero-copy">
        <p class="card-type">Pattern finder</p>
        <h2>${strongestCategory ? `${strongestCategory.name} is driving the most pressure` : "Your money is stable, but timing still matters"}</h2>
        <p>${strongestCategory ? `This is the category most likely to affect your stated goals if it stays unchecked. It is taking the most room compared with the plan.` : "The clearest signal is not overspending. It is how bills and income line up across the month."}</p>
      </div>
      <div class="insight-gauge" aria-hidden="true">
        <div class="gauge-label">Goal pressure</div>
        <div class="gauge-value">${Math.min(Math.round((strongestCategory?.ratio || 0.42) * 100), 100)}%</div>
        <div class="gauge-track">
          <span style="width:${Math.min(Math.round((strongestCategory?.ratio || 0.42) * 100), 100)}%"></span>
        </div>
      </div>
      <button class="cta" type="button" data-route="transactions">Review recent transactions</button>
    </article>
    <article class="insight-grid">
      <article class="insight-card">
        <span class="insight-badge warning">Cash flow timing</span>
        <strong>${snapshot.billPressure === "high" ? "Bills arrive before the buffer is ready" : "Cash timing still deserves attention"}</strong>
        <p>${snapshot.billPressure === "high" ? "A paycheck and a bill are too close together, so the month feels tighter than the raw balance suggests." : "The month may feel fine on paper, but a timing mismatch can still create stress later."}</p>
        <div class="insight-bars" aria-hidden="true">
          <span style="height:72%"></span>
          <span style="height:56%"></span>
          <span style="height:84%"></span>
          <span style="height:40%"></span>
        </div>
        <button class="cta secondary" type="button" data-route="paydays">See bill timing</button>
      </article>
      <article class="insight-card">
        <span class="insight-badge info">Hidden opportunity</span>
        <strong>${currency(hiddenSavings)} in possible breathing room</strong>
        <p>Small changes in timing, recurring spend, and category leakage may create room without hurting day-to-day life.</p>
        <div class="mini-donut" aria-hidden="true">
          <span style="--value:${Math.min(hiddenSavings, 100)}"></span>
        </div>
        <button class="cta secondary" type="button" data-route="hidden-savings">Open savings scan</button>
      </article>
      <article class="insight-card">
        <span class="insight-badge danger">Risk check</span>
        <strong>${highPressureCategories ? `${highPressureCategories} category${highPressureCategories === 1 ? "" : "ies"} need attention` : "No category is under heavy pressure"}</strong>
        <p>${uncategorizedCount ? `${uncategorizedCount} transactions still need categorization, which can hide the real pattern.` : "Your categories are fairly clean, so the next gain is likely in timing or recurring spend."}</p>
        <div class="insight-score">
          <div>
            <span>Recurring</span>
            <strong>${recurringCount}</strong>
          </div>
          <div>
            <span>Uncategorized</span>
            <strong>${uncategorizedCount}</strong>
          </div>
        </div>
        <button class="cta secondary" type="button" data-route="transactions">Clean up spending</button>
      </article>
    </article>
  `;
}

function renderAccounts() {
  screenTitle.textContent = "Accounts";
  return `
    ${screenHeading("Accounts", "Mock account balances for the prototype state engine.")}
    ${accounts.map((account) => `
      <article class="list-card">
        <h3>${account.name}</h3>
        <p>${account.type} · Available ${currency(account.availableBalance)}</p>
      </article>
    `).join("")}
  `;
}

function renderCashFlow(snapshot) {
  screenTitle.textContent = "Cash Flow";
  return `
    ${screenHeading("Cash Flow", "Near-term money movement without a spreadsheet feeling.")}
    <div class="metric-grid">
      ${metric("Incoming", currency(980))}
      ${metric("Essentials", currency(1366))}
      ${metric("Safe-to-spend", currency(snapshot.safeToSpend))}
      ${metric("Alerts", snapshot.unreadAlerts)}
    </div>
    <article class="section-card">
      <h2>This week</h2>
      <p>Rent and electric create the main pressure. A small transfer or bill timing adjustment brings the plan back into range.</p>
      <button class="cta" type="button" data-route="move-savings">Choose a fix</button>
    </article>
  `;
}

function renderPaydays(snapshot) {
  screenTitle.textContent = "Bills";
  return `
    ${screenHeading("Bills & Paydays", "Upcoming obligations and income timing in one place.")}
    <div class="metric-grid">
      ${metric("Next payday", "May 23")}
      ${metric("Bill pressure", snapshot.billPressure)}
    </div>
    <article class="list-card">
      <h3>Paycheck</h3>
      <p>May 23 · ${currency(980)} expected · income</p>
    </article>
    ${bills.map((bill) => `
      <article class="list-card">
        <h3>${bill.name}</h3>
        <p>${bill.dueDate} · ${currency(bill.amount)} · ${bill.status}</p>
        <button class="cta secondary" type="button" data-route="${bill.id === "b1" ? "coach-chat" : "cash-flow"}">Plan timing</button>
      </article>
    `).join("")}
  `;
}

function renderGoals() {
  screenTitle.textContent = "Goals";
  return `
    ${screenHeading("Progress", "Simple goal tracking with next contributions kept small.")}
    ${goals.map((goal) => {
      const percent = Math.round((goal.currentAmount / goal.targetAmount) * 100);
      return `
        <article class="list-card">
          <h3>${goal.name}</h3>
          <p>${currency(goal.currentAmount)} of ${currency(goal.targetAmount)} · ${percent}%</p>
          <div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div>
        </article>
      `;
    }).join("")}
    <button class="cta" type="button" data-route="savings">Adjust next contribution</button>
  `;
}

function recommendedWorkflows(snapshot) {
  const highCategory = snapshot.categoryPressure.find((category) => category.pressure === "high");
  const needsReview = transactions.filter((transaction) => !transaction.reviewed).length;
  const workflows = [
    {
      title: "Ask FinCoach",
      copy: "Talk through what matters now and get the rationale behind the suggested paths.",
      route: "coach-chat",
      tag: "Coach",
    },
    {
      title: "Find $100 hidden savings",
      copy: "Scan subscriptions, category leakage, timing, and offers for realistic breathing room.",
      route: "hidden-savings",
      tag: "Scan",
    },
  ];

  if (snapshot.billPressure === "high") {
    workflows.push({
      title: "Protect upcoming rent",
      copy: "The current bill timing creates pressure. Compare a small transfer against the bill calendar.",
      route: "move-savings",
      tag: "High priority",
    });
  } else {
    workflows.push({
      title: "Review bills and paydays",
      copy: "Bills are manageable, but timing still matters. Check the next payday and upcoming obligations.",
      route: "paydays",
      tag: "Timing",
    });
  }

  if (highCategory) {
    workflows.push({
      title: `Review ${highCategory.name}`,
      copy: "This category is close to its target. A quick look can prevent a surprise later.",
      route: "budgets",
      tag: "Budget",
    });
  }

  if (needsReview > 0) {
    workflows.push({
      title: `Categorize ${needsReview} transactions`,
      copy: "Clearing these improves budget accuracy and FinCoach recommendations.",
      route: "categorization",
      tag: "Review",
    });
  }

  workflows.push({
    title: "Log today's win",
    copy: "Record one positive action so momentum stays visible.",
    route: "log-win",
    tag: "Habit",
  });

  return workflows.slice(0, 5);
}

function renderWorkflows(snapshot) {
  screenTitle.textContent = "Money Moves";
  const workflows = recommendedWorkflows(snapshot);
  return `
    ${screenHeading("Money Moves", "Generated from the user's bill pressure, budget pressure, and review gaps.")}
    <article class="coach-chat-summary">
      <p class="card-type">FinCoach controller</p>
      <h3>Recommended path</h3>
      <p>These money moves are selected from the current fake financial state. Use FinCoach to ask why, then choose an action.</p>
      <button class="cta" type="button" data-route="coach-chat">Ask why this path</button>
    </article>
    ${workflows.map((workflow) => `
      <article class="workflow-card">
        <p class="card-type">${workflow.tag}</p>
        <h3>${workflow.title}</h3>
        <p>${workflow.copy}</p>
        <button class="cta" type="button" data-route="${workflow.route}">Start</button>
      </article>
    `).join("")}
  `;
}

function renderReports(snapshot) {
  screenTitle.textContent = "Reports";
  return `
    ${screenHeading("Reports", "A calmer reporting surface focused on explanation.")}
    <div class="metric-grid">
      ${metric("Bill pressure", snapshot.billPressure)}
      ${metric("Streak", `${snapshot.streakDays} days`)}
      ${metric("Safe-to-spend", currency(snapshot.safeToSpend))}
      ${metric("Categories high", snapshot.categoryPressure.filter((category) => category.pressure === "high").length)}
    </div>
    <button class="cta" type="button" data-route="insights">Open insights</button>
  `;
}

function renderSettings() {
  screenTitle.textContent = "Settings";
  return `
    ${screenHeading("Settings", "Prototype controls and preferences.")}
    <article class="settings-card">
      <h3>Demo state</h3>
      <p>Use these scenarios to show different hero states during the demo.</p>
      <div class="scenario-grid">
        ${demoScenarios().map((scenario) => `
          <button class="scenario-chip ${state.demoScenario === scenario.id ? "active" : ""}" type="button" data-demo-scenario="${scenario.id}">
            <strong>${scenario.label}</strong>
            <span>${scenario.copy}</span>
          </button>
        `).join("")}
      </div>
    </article>
    <article class="settings-card">
      <h3>Coaching tone</h3>
      <p>Calm, direct, non-judgmental.</p>
    </article>
    <article class="settings-card">
      <h3>Data mode</h3>
      <p>Fake data only. No bank connection is active.</p>
    </article>
    <article class="settings-card">
      <h3>Investing waitlist</h3>
      <p>Test demand for a future stock purchase feature without offering the service yet.</p>
      <button class="cta secondary" type="button" data-route="stocks-waitlist">Join waitlist</button>
    </article>
    <article class="settings-card">
      <h3>Prototype status</h3>
      <p>${state.completedActions.length} money moves completed in this session.</p>
    </article>
  `;
}

function renderStocksWaitlist() {
  screenTitle.textContent = "Waitlist";
  return `
    ${screenHeading("Stock purchase waitlist", "A smoke test for future demand. This does not place trades, give investment advice, or connect to a brokerage.")}
    <article class="section-card">
      <h2>Why this exists</h2>
      <p>We want to understand whether users would want a future investing feature before we build anything regulated. This waitlist captures interest only.</p>
      <button class="cta" type="button" data-route="home">Back to dashboard</button>
    </article>
    <article class="list-card">
      <h3>What the feature could become</h3>
      <p>Educational projections, opt-in scenario tools, and a future broker-partner flow if we decide to move beyond the prototype.</p>
    </article>
    <article class="list-card">
      <h3>What it will not do here</h3>
      <p>No order routing, no securities recommendations, no account linking for trading, and no borrowing against equities.</p>
    </article>
    <button class="cta secondary" type="button" data-complete="Joined stock waitlist" data-next="home">Join waitlist</button>
  `;
}

function demoScenarios() {
  return [
    { id: "auto", label: "Auto", copy: "Uses live snapshot logic" },
    { id: "bill-heavy", label: "Bill-heavy", copy: "Lead with pressure" },
    { id: "buffer-watch", label: "Buffer watch", copy: "Protect cash cushion" },
    { id: "overdraft", label: "Overdraft risk", copy: "Show urgency early" },
    { id: "fraud", label: "Fraud alert", copy: "Interrupt with review" },
    { id: "growth", label: "Growth", copy: "Stable cash flow" },
  ];
}

function renderLogWin() {
  screenTitle.textContent = "Log Win";
  return `
    ${screenHeading("Log today's win", "Pick one positive action. Keep it small and true.")}
    <article class="workflow-card">
      <h3>What went right today?</h3>
      <div class="workflow-choices">
        <button class="choice-button" type="button" data-complete="Logged today's win" data-next="wins-log">Checked upcoming bills</button>
        <button class="choice-button" type="button" data-complete="Logged today's win" data-next="wins-log">Avoided an impulse purchase</button>
        <button class="choice-button" type="button" data-complete="Logged today's win" data-next="wins-log">Reviewed spending without spiraling</button>
      </div>
    </article>
  `;
}

function renderMoveSavings(snapshot) {
  screenTitle.textContent = "Move Funds";
  return `
    ${screenHeading("Cover the rent gap", "A small transfer can reduce pressure before Friday.")}
    <article class="workflow-card">
      <h3>Suggested move</h3>
      <p>Move $50 from Safety Buffer to Everyday Checking. This covers the current ${currency(Math.abs(snapshot.safeToSpend))} gap and leaves savings at ${currency(670)}.</p>
      <div class="workflow-choices">
        <button class="choice-button" type="button" data-complete="Moved $50 from savings">Move $50 from savings</button>
        <button class="choice-button" type="button" data-route="bills">Review bills first</button>
      </div>
    </article>
  `;
}

function renderSubscriptionReview() {
  screenTitle.textContent = "Subscription";
  return `
    ${screenHeading("Review subscription", "Decide whether this still fits the week.")}
    <article class="workflow-card">
      <h3>Streaming Bundle</h3>
      <p>$22 renews on May 28. Pausing it would add a little more breathing room this month.</p>
      <div class="workflow-choices">
        <button class="choice-button" type="button" data-complete="Paused streaming bundle">Pause for this month</button>
        <button class="choice-button" type="button" data-complete="Kept streaming bundle">Keep and mark reviewed</button>
      </div>
    </article>
  `;
}

function renderAddFunds() {
  screenTitle.textContent = "Add Funds";
  return `
    ${screenHeading("Add Funds", "Mock flow for adjusting the short-term plan, with coaching one tap away.")}
    <article class="workflow-card">
      <h3>Choose an adjustment</h3>
      <div class="workflow-choices">
        <button class="choice-button" type="button" data-route="coach-chat">Ask FinCoach first</button>
        <button class="choice-button" type="button" data-complete="Added $50 to checking">Add $50 to checking</button>
        <button class="choice-button" type="button" data-complete="Planned incoming cash">Mark incoming cash for Friday</button>
        <button class="choice-button" type="button" data-route="cash-flow">Review cash flow first</button>
      </div>
    </article>
  `;
}

function screenHeading(title, copy) {
  return `<div class="screen-heading"><h2>${title}</h2><p>${copy}</p></div>`;
}

function metric(label, value) {
  return `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`;
}

function workflowCard(title, copy, route) {
  return `
    <article class="workflow-card">
      <h3>${title}</h3>
      <p>${copy}</p>
      <button class="cta" type="button" data-route="${route}">Start</button>
    </article>
  `;
}

document.querySelectorAll("[data-route]").forEach((button) => {
  button.addEventListener("click", () => setRoute(button.dataset.route));
});

render();
