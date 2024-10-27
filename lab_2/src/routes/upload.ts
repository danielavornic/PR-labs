import { Router } from "express";
import { UploadController } from "../controllers/upload";
import multer from "multer";

const router = Router();
const uploadController = new UploadController();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/file", upload.single("file"), (req, res) => {
  uploadController.handleFileUpload(req, res);
});

export default router;
