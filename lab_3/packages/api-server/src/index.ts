import express, { Express } from "express";
import productRoutes from "./routes/products";
import uploadRoutes from "./routes/upload";

const app: Express = express();

app.use(express.json());

app.use("/api/products", productRoutes);
app.use("/api/upload", uploadRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
