import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const config = {
  server: {
    port: parseInt(process.env.PORT || "8000"),
    id: process.env.SERVER_ID || "1",
    udpPort: parseInt(process.env.UDP_PORT || "3000"),
  },
  dataManager: {
    port: parseInt(process.env.DATA_MANAGER_PORT || "8080"),
    host: process.env.DATA_MANAGER_HOST || "data_manager",
  },
  peers: {
    udpPorts: {
      "1": parseInt(process.env.UDP_PORT_1 || "3000"),
      "2": parseInt(process.env.UDP_PORT_2 || "3001"),
      "3": parseInt(process.env.UDP_PORT_3 || "3002"),
    },
  },
};
