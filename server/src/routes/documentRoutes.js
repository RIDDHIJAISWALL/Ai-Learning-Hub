import express from 'express';
import multer from 'multer';
import { protect } from '../middlewares/authMiddleware.js';
import { uploadDocument, getDocuments, deleteDocument } from '../controllers/documentController.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

router.route('/')
  .get(protect, getDocuments);

router.route('/upload')
  .post(protect, upload.single('file'), uploadDocument);

router.route('/:id')
  .delete(protect, deleteDocument);

export default router;
