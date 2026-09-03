import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { buildFinancialSnapshot } from "./src/financial-engine.js";
import { createCoachResponse } from "./src/coach-engine.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || true,
  }),
);

const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID || "",
        "PLAID-SECRET": process.env.PLAID_SECRET || "",
      },
    },
  }),
);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "fincoach-backend" });
});

app.post("/api/plaid/link-token", async (req, res) => {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: req.body?.userId || "fincoach-user" },
      client_name: "FinCoach",
      language: "en",
      country_codes: ["US"],
      products: ["transactions", "auth"],
      webhook: req.body?.webhook,
    });

    res.json({ linkToken: response.data.link_token });
  } catch (error) {
    res.status(500).json({
      error: "Failed to create Plaid link token",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post("/api/plaid/exchange", async (req, res) => {
  try {
    const { publicToken } = req.body || {};
    if (!publicToken) {
      return res.status(400).json({ error: "publicToken is required" });
    }

    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    res.json({
      accessToken: response.data.access_token,
      itemId: response.data.item_id,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to exchange Plaid token",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post("/api/financial-snapshot", (req, res) => {
  try {
    const snapshot = buildFinancialSnapshot(req.body || {});
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({
      error: "Failed to compute financial snapshot",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post("/api/coach", async (req, res) => {
  try {
    const response = await createCoachResponse(req.body || {});
    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: "Failed to generate coach response",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

app.listen(port, () => {
  console.log(`FinCoach backend listening on http://127.0.0.1:${port}`);
});
