import express, { Express } from "express";
import productRoutes from "./routes/products";
import uploadRoutes from "./routes/upload";
import { LeaderElection } from "./leader/udp-server";
import axios from "axios";
import { leaderCheck, setLeaderStatus } from "./middleware/leader-check";
import { config } from "./config/server";

const app: Express = express();
app.use(express.json());
app.use("/api/products", leaderCheck, productRoutes);
app.use("/api/upload", leaderCheck, uploadRoutes);

const leaderElection = new LeaderElection(
  config.server.udpPort,
  config.server.id,
  async (leaderId: string) => {
    if (leaderId === config.server.id) {
      console.log(`This server (${config.server.id}) is the leader`);
      let retries = 3;

      while (retries > 0) {
        try {
          await axios.post(
            `http://${config.dataManager.host}:${config.dataManager.port}/update-leader`,
            {
              leaderId: config.server.id,
              apiPort: config.server.port,
            }
          );
          setLeaderStatus(true);
          break;
        } catch (error) {
          retries--;
          if (retries === 0) {
            setLeaderStatus(false);
            console.error(
              "Failed to notify data manager after all retries:",
              error
            );
          } else {
            console.log(`Retrying notification. ${retries} attempts left`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }
    } else {
      console.log(`ℹ️ Server ${leaderId} is the leader`);
      setLeaderStatus(false);
    }
  }
);

const peerIds = ["1", "2", "3"].filter((id) => id !== config.server.id);
peerIds.forEach((peerId) => {
  leaderElection.addPeer(
    peerId,
    config.peers.udpPorts[peerId as "1" | "2" | "3"]
  );
});

app.listen(config.server.port, () => {
  console.log(
    `Server ${config.server.id} running on port ${config.server.port}`
  );
  console.log(`UDP Election service running on port ${config.server.udpPort}`);
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM. Performing graceful shutdown...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("Received SIGINT. Performing graceful shutdown...");
  process.exit(0);
});

export default app;
