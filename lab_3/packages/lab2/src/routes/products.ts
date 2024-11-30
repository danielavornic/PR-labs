import { Router } from "express";
import { ProductController } from "../controllers/products";

const router = Router();
const productController = new ProductController();

router.post("/", (req, res) => {
  productController.create(req, res);
});
router.get("/", (req, res, next) => {
  productController.getAll(req, res);
});
router.get("/:id", (req, res, next) => {
  productController.getById(req, res);
});
router.put("/:id", (req, res) => {
  productController.update(req, res);
});
router.delete("/:id", (req, res) => {
  productController.delete(req, res);
});

export default router;
