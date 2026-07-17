import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { startInterview, submitAnswer, getInterviewFeedback } from '../controllers/interviewController.js';

const router = express.Router();

router.post('/start', protect, startInterview);
router.post('/answer', protect, submitAnswer);
router.get('/feedback/:chatId', protect, getInterviewFeedback);

export default router;
