import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { createChat, getChats, getMessages, sendMessage } from '../controllers/chatController.js';

const router = express.Router();

router.route('/')
  .post(protect, createChat)
  .get(protect, getChats);

router.route('/:id/messages')
  .get(protect, getMessages)
  .post(protect, sendMessage);

export default router;
