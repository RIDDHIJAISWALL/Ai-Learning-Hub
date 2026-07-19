import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { reviewCode, debugCode, explainCode, optimizeCode, generatePracticeQuestion } from '../controllers/codingController.js';

const router = express.Router();

router.post('/review', protect, reviewCode);
router.post('/debug', protect, debugCode);
router.post('/explain', protect, explainCode);
router.post('/optimize', protect, optimizeCode);
router.post('/practice', protect, generatePracticeQuestion);
router.post('/debug', protect, reviewCode);
router.post('/explain', protect, reviewCode);
router.post('/optimize', protect, reviewCode);

export default router;
