import { app } from "./app";
import { scheduler } from "./lib/scheduler";

const port = Number(process.env.PORT ?? 4000);
const server = app.listen(port, () => {
  console.log(`API http://localhost:${port}`);
  scheduler.start();
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  scheduler.stop();
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});
