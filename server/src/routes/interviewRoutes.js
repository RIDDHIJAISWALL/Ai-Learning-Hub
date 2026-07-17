import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { generateFeedback } from '../controllers/interviewController.js';

const router = express.Router();

router.post('/feedback', protect, generateFeedback);

export default router;
