import { Request, Response } from "express";
import multer from "multer";

const storage = multer.memoryStorage();

export class UploadController {
  async handleFileUpload(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileContent = req.file.buffer.toString("utf-8");

      try {
        const fileExtension = req.file.originalname.split(".").pop();

        if (fileExtension !== "json") {
          console.log("Received non-JSON file:", fileContent);
          return res.json({
            message: "File uploaded successfully",
            filename: req.file.originalname,
            size: req.file.size,
            content: fileContent,
          });
        }

        const jsonContent = JSON.parse(fileContent);
        console.log("Received JSON content:", jsonContent);
        res.json({
          message: "File uploaded successfully",
          filename: req.file.originalname,
          size: req.file.size,
          content: jsonContent,
        });
      } catch (parseError) {
        return res.status(400).json({ error: "Invalid JSON file" });
      }
    } catch (error) {
      console.error("Error handling file upload:", error);
      res.status(500).json({ error: "Failed to process file upload" });
    }
  }
}
