import { DEFAULT_HEADERS, DEFAULT_TIMEOUT, handleError } from "@/utils/scraper";
import * as tls from "tls";
import { URL } from "url";
import BaseScraper from "./base-scraper";

class TCPScraper extends BaseScraper {
  protected async getPageContent(url: string): Promise<string | null> {
    return new Promise((resolve) => {
      const parsedUrl = new URL(url);

      const options: tls.ConnectionOptions = {
        host: parsedUrl.hostname,
        port: 443,
        servername: parsedUrl.hostname,
        rejectUnauthorized: false,
        minVersion: "TLSv1.2" as tls.SecureVersion,
        timeout: DEFAULT_TIMEOUT,
      };

      const client = tls.connect(options, () => {
        this.sendRequest(client, parsedUrl);
      });

      let rawResponse = "";

      client.on("data", (chunk) => {
        rawResponse += chunk.toString();
      });

      client.on("end", () => {
        const body = this.extractBody(rawResponse);
        resolve(body);
      });

      client.on("error", (err) => {
        resolve(handleError(err, `TLS connection error for ${url}`));
      });

      client.on("timeout", () => {
        client.destroy();
        resolve(
          handleError(
            new Error("Connection timed out"),
            `TLS connection timed out for ${url}`
          )
        );
      });
    });
  }

  private sendRequest(client: tls.TLSSocket, parsedUrl: URL): void {
    const headers = Object.entries(DEFAULT_HEADERS)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\r\n");

    const request =
      `GET ${parsedUrl.pathname}${parsedUrl.search} HTTP/1.1\r\n` +
      `Host: ${parsedUrl.hostname}\r\n` +
      `${headers}\r\n` +
      `Connection: close\r\n\r\n`;

    client.write(request);
  }

  private extractBody(rawResponse: string): string {
    const bodyStart = rawResponse.indexOf("\r\n\r\n") + 4;
    return rawResponse.slice(bodyStart);
  }
}

export default TCPScraper;
