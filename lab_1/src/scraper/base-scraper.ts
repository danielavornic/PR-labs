import * as cheerio from "cheerio";
import Product from "@/models/product";
import { validateProduct } from "../utils/validators";

abstract class BaseScraper {
  protected url: string;

  constructor(url: string) {
    this.url = url;
  }

  protected abstract getPageContent(url: string): Promise<string | null>;

  protected extractProductInfo(html: string): Product[] {
    const $ = cheerio.load(html);
    const products: Product[] = [];

    $(".card-product").each((_, element) => {
      const $element = $(element);
      const titleElement = $element.find(".title a");

      const name = titleElement.text().trim() || "N/A";
      const link = titleElement.attr("href") || "N/A";
      const priceText = $element
        .find(".price-new b")
        .text()
        .trim()
        .replace(" ", "");
      const price = priceText ? parseInt(priceText) : 0;

      const product = new Product(name, price, link, "N/A");
      if (validateProduct(product)) {
        products.push(product);
      }
    });

    return products;
  }

  public async scrape(): Promise<Product[]> {
    const html = await this.getPageContent(this.url);
    if (html) {
      const products = this.extractProductInfo(html);
      await this.fetchAdditionalDetails(products);
      return products;
    }
    return [];
  }

  protected async fetchAdditionalDetails(products: Product[]): Promise<void> {
    for (const product of products) {
      const productPage = await this.getPageContent(product.link);
      if (productPage) {
        const $product = cheerio.load(productPage);
        product.color = $product(".color a").first().attr("title") || "N/A";
      } else {
        console.error(`Failed to retrieve product page: ${product.link}`);
      }
    }
  }
}

export default BaseScraper;
