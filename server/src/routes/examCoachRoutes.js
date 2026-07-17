import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { generateStudyPlan } from '../controllers/examCoachController.js';

const router = express.Router();

router.post('/plan', protect, generateStudyPlan);

export default router;
