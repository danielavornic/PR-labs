import Product from "@/models/product";

const MDL_TO_EUR_RATE = 0.0518; // 1 MDL = 0.0518 EUR (October 5, 2024)

export interface ProcessedData {
  products: Product[];
  totalPrice: number;
  timestamp: Date;
}

export const convertPrice = (product: Product): Product => {
  const newPrice = product.price * MDL_TO_EUR_RATE;
  const formattedPrice = parseFloat(newPrice.toFixed(2));

  return new Product(product.name, formattedPrice, product.color);
};

export const filterByPriceRange = (
  products: Product[],
  minPrice: number,
  maxPrice: number
): Product[] =>
  products.filter((p) => p.price >= minPrice && p.price <= maxPrice);

export const sumPrices = (products: Product[]): number =>
  products.reduce((sum, product) => sum + product.price, 0);

export const processProducts = (
  products: Product[],
  minPrice: number,
  maxPrice: number
): ProcessedData => {
  const convertedProducts = products.map(convertPrice);
  const filteredProducts = filterByPriceRange(
    convertedProducts,
    minPrice,
    maxPrice
  );
  const totalPrice = sumPrices(filteredProducts);

  return {
    products: filteredProducts,
    totalPrice: parseFloat(totalPrice.toFixed(2)),
    timestamp: new Date(),
  };
};
