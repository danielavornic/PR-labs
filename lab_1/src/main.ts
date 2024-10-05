import { ProcessedData, processProducts } from "@/processors/data-processor";
import TCPScraper from "@/scraper/tcp-scraper";
import WebScraper from "@/scraper/web-scraper";

const main = async () => {
  const url = "https://darwin.md/laptopuri/personale";

  const webScraper = new WebScraper(url);
  const tcpScraper = new TCPScraper(url);

  const products = await tcpScraper.scrape();

  console.log("Scraped Products:", products);

  const minPriceEUR = 400;
  const maxPriceEUR = 1000;
  const processedData: ProcessedData = processProducts(
    products,
    minPriceEUR,
    maxPriceEUR
  );
  console.log("Processed Data:");
  console.log("Filtered Products:", processedData.products);
  console.log(`Number of products in range: ${processedData.products.length}`);
  console.log(
    `Total price of filtered products: €${processedData.totalPrice.toFixed(2)}`
  );
  console.log(`Timestamp: ${processedData.timestamp.toISOString()}`);
};

main().catch(console.error);
