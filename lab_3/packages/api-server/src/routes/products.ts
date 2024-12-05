import { Router } from "express";
import { ProductController } from "../controllers/products";
import { leaderCheck } from "../middleware/leader-check";

const router = Router();
const productController = new ProductController();

router.get("/", (req, res, next) => {
  productController.getAll(req, res);
});
router.get("/:id", (req, res, next) => {
  productController.getById(req, res);
});

router.post("/", leaderCheck, (req, res) => {
  productController.create(req, res);
});
router.put("/:id", leaderCheck, (req, res) => {
  productController.update(req, res);
});
router.delete("/:id", leaderCheck, (req, res) => {
  productController.delete(req, res);
});

export default router;
