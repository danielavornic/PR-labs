import { Product } from "../models/product";

export function validateProduct(product: Product): boolean {
  // White space trimming
  product.name = product.name.trim();
  product.link = product.link.trim();
  product.color = product.color.trim();

  // Price validation
  if (
    typeof product.price !== "number" ||
    isNaN(product.price) ||
    product.price < 0
  ) {
    console.error(`Invalid price for product: ${product.name}`);
    return false;
  }

  // Name validation
  if (product.name.length === 0) {
    console.error(`Empty name for product with price: ${product.price}`);
    return false;
  }

  // Link validation
  try {
    new URL(product.link);
  } catch {
    console.error(`Invalid URL for product: ${product.name}`);
    return false;
  }

  return true;
}
