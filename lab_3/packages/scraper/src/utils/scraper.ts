import axios from "axios";

export const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

export const DEFAULT_TIMEOUT = 10000;

export const handleError = (error: any, context: string): null => {
  if (axios.isAxiosError(error)) {
    console.error(
      `${context}. Status: ${error.response?.status}. Message: ${error.message}`
    );
  } else {
    console.error(`${context}. Error: ${error}`);
  }
  return null;
};
