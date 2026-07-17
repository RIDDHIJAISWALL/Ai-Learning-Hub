import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { generateStudyPlan, getStudyPlans, updateStudyPlanProgress } from '../controllers/examCoachController.js';

const router = express.Router();

router.post('/plan', protect, generateStudyPlan);
router.get('/plans', protect, getStudyPlans);
router.patch('/plans/:id', protect, updateStudyPlanProgress);

export default router;
