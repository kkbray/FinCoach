import { buildFinancialSnapshot } from "./financial-engine.js";

function summarizeRisk(snapshot) {
  if (snapshot.transactionSignals.suspiciousCount > 0) {
    return {
      title: "Possible fraud needs a quick review.",
      label: "Fraud alert",
    };
  }
  if (snapshot.billPressure === "high") {
    return {
      title: "This is a bill-heavy week.",
      label: "Bill pressure high",
    };
  }
  if (snapshot.billPressure === "medium") {
    return {
      title: "Your bills are covered. Let’s protect the buffer.",
      label: "Buffer watch",
    };
  }
  return {
    title: "You have room to make progress.",
    label: "Stable cash flow",
  };
}

export async function createCoachResponse(input) {
  const snapshot = input.snapshot || buildFinancialSnapshot(input);
  const summary = summarizeRisk(snapshot);
  const strategyChoices = input.strategyChoices || [];
  const question = String(input.question || "").trim().toLowerCase();

  let answer = "What matters now is keeping the plan calm and visible.";
  if (question.includes("why")) {
    answer = "The recommendation comes from bill timing, buffer pressure, and whether the current categories are running hot.";
  } else if (question.includes("hidden")) {
    answer = `I found about ${snapshot.hiddenSavingsEstimate} in possible breathing room across recurring spend and timing.`;
  } else if (question.includes("invest")) {
    answer = "We can support the future investing path, but the MVP should first make the cash flow and buffer picture clear.";
  }

  return {
    heroMessage: summary.title,
    heroLabel: summary.label,
    answer,
    strategyChoices,
    snapshot,
  };
}
