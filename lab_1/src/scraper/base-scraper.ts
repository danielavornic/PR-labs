import Product from "@/models/product";
import * as cheerio from "cheerio";
import { validateProduct } from "../utils/validators";

interface ProductInfo {
  name: string;
  price: number;
  link: string;
}

abstract class BaseScraper {
  protected url: string;

  constructor(url: string) {
    this.url = url;
  }

  protected abstract getPageContent(url: string): Promise<string | null>;

  protected extractProductInfo(html: string): ProductInfo[] {
    const $ = cheerio.load(html);
    const products: ProductInfo[] = [];

    $(".product-card").each((_, element) => {
      const $element = $(element);
      const titleElement = $element.find(".title-product");
      const linkElement = $element.find(".stretched-link");

      const name = titleElement.text().trim() || "N/A";
      const link = linkElement.attr("href") || "";
      const priceText = $element
        .find(".price-new")
        .text()
        .trim()
        .replace(" lei", "")
        .replace(" ", "");
      const price = priceText ? parseInt(priceText) : 0;

      products.push({ name, price, link });
    });

    return products;
  }

  public async scrape(): Promise<Product[]> {
    const html = await this.getPageContent(this.url);
    if (html) {
      const productInfos = this.extractProductInfo(html);
      const products = await this.fetchProductDetails(productInfos);
      return products.filter(validateProduct);
    }
    return [];
  }

  protected async fetchProductDetails(
    productInfos: ProductInfo[]
  ): Promise<Product[]> {
    const products: Product[] = [];

    for (const info of productInfos) {
      const productPage = await this.getPageContent(info.link);
      if (productPage) {
        const $product = cheerio.load(productPage);
        const color =
          $product(".colors-product").first().attr("data-bs-original-title") ||
          "N/A";
        products.push(new Product(info.name, info.price, color));
      } else {
        console.error(`Failed to retrieve product page: ${info.link}`);
        // Create product with default color if page fetch fails
        products.push(new Product(info.name, info.price, "N/A"));
      }
    }

    return products;
  }
}

export default BaseScraper;
