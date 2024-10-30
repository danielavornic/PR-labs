import express, { Express } from "express";
import productRoutes from "./routes/products";
import uploadRoutes from "./routes/upload";
import { CoordinatedTCPServer } from "./tcp/coordinated-server";
import { ChatServer } from "./websocket/chat";

const app: Express = express();

app.use(express.json());

app.use("/api/products", productRoutes);
app.use("/api/upload", uploadRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const wsPort = process.env.WS_PORT || 3001;
new ChatServer(Number(wsPort));

new CoordinatedTCPServer(3003);

export default app;
