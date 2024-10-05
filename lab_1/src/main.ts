import { ProcessedData, processProducts } from "@/processors/data-processor";
import TCPScraper from "@/scraper/tcp-scraper";
import WebScraper from "@/scraper/web-scraper";
import JSONSerializer from "@/serializers/json-serializer";
import CustomSerializer from "@/serializers/tagged-binary-serializer";
import XMLSerializer from "@/serializers/xml-serializer";

const main = async () => {
  const url = "https://darwin.md/laptopuri/personale";
  const minPriceEUR = 400;
  const maxPriceEUR = 1000;

  // const credentials = "201:503";
  // const encodedCredentials = btoa(credentials);

  const webScraper = new WebScraper(url);
  const tcpScraper = new TCPScraper(url);
  const jsonSerializer = new JSONSerializer();
  const xmlSerializer = new XMLSerializer();
  const customSerializer = new CustomSerializer();

  const products = await tcpScraper.scrape();
  const processedData: ProcessedData = processProducts(
    products,
    minPriceEUR,
    maxPriceEUR
  );

  const jsonSerializedData = jsonSerializer.serialize(processedData);
  const xmlSerializedData = xmlSerializer.serialize(processedData);
  console.log("JSON Serialized Data:", jsonSerializedData);
  console.log("XML Serialized Data:", xmlSerializedData);

  const customSerializedData = customSerializer.serialize(processedData);
  const customDeserializedData =
    customSerializer.deserialize(customSerializedData);
  console.log("Custom Serialized Data:", customSerializedData);
  console.log("Custom Deserialized Data:", customDeserializedData);
};

main().catch(console.error);
