import express from "express";
import helmet from "helmet";
import cors from "cors";
import { avatarDir, config } from "./config.js";
import { query } from "./db.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { apiLimiter } from "./middleware/limiters.js";
import authRoutes from "./routes/auth.js";
import meRoutes from "./routes/me.js";
import workshopRoutes from "./routes/workshops.js";
import tournamentRoutes from "./routes/tournaments.js";
import groupRoutes from "./routes/groups.js";
import reviewRoutes from "./routes/reviews.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", config.trustProxy);

  // "cross-origin" en recursos: permite que la web (si está en otro dominio) muestre las fotos.
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

  if (config.corsOrigins.length) {
    app.use(
      cors({
        origin(origin, cb) {
          cb(null, !origin || config.corsOrigins.includes(origin));
        },
        methods: ["GET", "POST", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
        maxAge: 600,
      })
    );
  }

  app.use(express.json({ limit: "50kb" }));

  // Fotos de perfil (nombres aleatorios que no se repiten: se pueden cachear mucho tiempo)
  app.use(
    "/uploads/avatars",
    express.static(avatarDir, { index: false, dotfiles: "ignore", maxAge: "30d", immutable: true })
  );

  app.use("/api", apiLimiter);

  app.get("/api/health", async (req, res) => {
    await query("SELECT 1");
    res.json({ ok: true });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/me", meRoutes);
  app.use("/api/workshops", workshopRoutes);
  app.use("/api/tournaments", tournamentRoutes);
  app.use("/api/groups", groupRoutes);
  app.use("/api/reviews", reviewRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
