import { ProcessedData, processProducts } from "@/processors/data-processor";
import TCPScraper from "@/scraper/tcp-scraper";
import WebScraper from "@/scraper/web-scraper";
import JSONSerializer from "@/serializers/json-serializer";
import XMLSerializer from "@/serializers/xml-serializer";

const main = async () => {
  const url = "https://darwin.md/laptopuri/personale";
  const minPriceEUR = 400;
  const maxPriceEUR = 1000;

  const webScraper = new WebScraper(url);
  const tcpScraper = new TCPScraper(url);

  const products = await tcpScraper.scrape();
  const processedData: ProcessedData = processProducts(
    products,
    minPriceEUR,
    maxPriceEUR
  );

  // console.log("Filtered Products:", processedData.products);
  // console.log(`Products count in range: ${processedData.products.length}`);
  // console.log(`Total price: €${processedData.totalPrice.toFixed(2)}`);
  // console.log(`Timestamp: ${processedData.timestamp.toISOString()}`);

  const jsonSerializer = new JSONSerializer();
  const xmlSerializer = new XMLSerializer();

  const jsonSerializedData = jsonSerializer.serialize(processedData);
  const xmlSerializedData = xmlSerializer.serialize(processedData);

  console.log("JSON Serialized Data:", jsonSerializedData);
  console.log("XML Serialized Data:", xmlSerializedData);
};

main().catch(console.error);
