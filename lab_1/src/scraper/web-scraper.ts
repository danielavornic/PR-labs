import { DEFAULT_HEADERS, DEFAULT_TIMEOUT, handleError } from "@/utils/scraper";
import axios, { AxiosInstance } from "axios";
import BaseScraper from "./base-scraper";

class WebScraper extends BaseScraper {
  private readonly axiosInstance: AxiosInstance;

  constructor(url: string) {
    super(url);
    this.axiosInstance = axios.create({
      headers: DEFAULT_HEADERS,
      timeout: DEFAULT_TIMEOUT,
    });
  }

  protected async getPageContent(url: string): Promise<string | null> {
    try {
      const response = await this.axiosInstance.get(url);
      return response.data;
    } catch (error) {
      return handleError(error, `Failed to retrieve page content from ${url}`);
    }
  }
}

export default WebScraper;
