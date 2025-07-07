import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";

const app = express();
// Allow CORS from frontend
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Custom request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Register routes (assumes registerRoutes returns a server if needed, but we use app.listen)
    await registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      // Optionally, remove this if you want to avoid throwing after response:
      // throw err;
    });

    // Setup Vite in development
    if (app.get("env") === "development") {
      await setupVite(app); // If setupVite needs the server, pass it; otherwise, just `app` is fine
    } else {
      serveStatic(app);
    }

    // Serve the app on port 5000
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
    app
      .listen(port, "0.0.0.0", () => {
        log(`serving on port ${port}`);
      })
      .on("error", (err) => {
        log(`Failed to start server: ${err.message}`);
        process.exit(1);
      });
  } catch (err) {
    log(`Fatal error: ${err}`);
    process.exit(1);
  }
})();
