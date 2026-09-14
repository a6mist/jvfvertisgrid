import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { authRouter } from "./routes/auth.routes";
import { simulationsRouter } from "./routes/simulations.routes";
import { protocolsRouter } from "./routes/protocols.routes";
import { auditLogsRouter } from "./routes/auditLogs.routes";
import { dashboardRouter } from "./routes/dashboard.routes";
import { settingsRouter } from "./routes/settings.routes";
import { transactionLogRouter } from "./routes/transactionLog.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();

// This service is a local simulation console. It never opens outbound
// connections to Visa, Mastercard, or any banking/payment network.
app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "200kb" }));
app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    mode: "SIMULATION_ONLY",
    notice: "NOT CONNECTED TO VISA, MASTERCARD, BANKING NETWORKS, OR PAYMENT NETWORKS",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/simulations", simulationsRouter);
app.use("/api/protocols", protocolsRouter);
app.use("/api/audit-logs", auditLogsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/transaction-log", transactionLogRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Transaction Verification & Protocol Simulator API listening on port ${env.port} (SIMULATION MODE ONLY)`);
});
