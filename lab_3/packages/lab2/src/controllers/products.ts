import { Request, Response } from "express";
import { ProductService } from "../services/products";

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  async getAll(req: Request, res: Response) {
    try {
      const offset = Number(req.query.offset) || 0;
      const limit = Number(req.query.limit) || 10;

      if (offset < 0) {
        return res.status(400).json({
          error: "Offset must be non-negative",
        });
      }

      if (limit < 1 || limit > 100) {
        return res.status(400).json({
          error: "Limit must be between 1 and 100",
        });
      }

      const result = await this.productService.findAll({ offset, limit });
      res.json(result);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({
        error: "Failed to fetch products",
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          error: "Invalid ID format",
        });
      }

      const product = await this.productService.findById(id);

      if (!product) {
        return res.status(404).json({
          error: "Product not found",
        });
      }

      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({
        error: "Failed to fetch product",
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, price, color } = req.body;

      if (!name || !price || !color) {
        return res.status(400).json({
          error: "Missing required fields",
        });
      }

      const product = await this.productService.create(req.body);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({
        error: "Failed to create product",
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          error: "Invalid ID format",
        });
      }

      const product = await this.productService.update(id, req.body);

      if (!product) {
        return res.status(404).json({
          error: "Product not found",
        });
      }

      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({
        error: "Failed to update product",
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          error: "Invalid ID format",
        });
      }

      const deleted = await this.productService.delete(id);

      if (!deleted) {
        return res.status(404).json({
          error: "Product not found",
        });
      }

      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({
        error: "Failed to delete product",
      });
    }
  }
}
