import { WebScraper } from "./scraper/web-scraper";

async function main() {
  const scraper = new WebScraper("https://darwin.md/laptopuri/personale");
  const products = await scraper.scrape();

  console.log(products);
}

main().catch(console.error);
