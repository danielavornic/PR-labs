import { Product } from "../models/product";
import { validateProduct } from "../utils/validators";
import axios from "axios";
import * as cheerio from "cheerio";

export class WebScraper {
  private readonly url: string;
  private readonly headers: Record<string, string>;

  constructor(url: string) {
    this.url = url;
    this.headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    };
  }

  private async getPageContent(url: string): Promise<string | null> {
    try {
      const response = await axios.get(url, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error(`Failed to retrieve page content. Error: ${error}`);
      return null;
    }
  }

  private async extractProductInfo(html: string): Promise<Product[]> {
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
      const price = priceText ? parseFloat(priceText) : 0;

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
      return this.extractProductInfo(html);
    }
    return [];
  }
}
