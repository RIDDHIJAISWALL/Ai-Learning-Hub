import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assistantType: {
      type: String,
      enum: ['Tutor', 'ExamCoach', 'NotesExplainer', 'CodingTutor', 'InterviewTrainer'],
      required: true,
    },
    title: {
      type: String,
      default: 'New Chat',
    },
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UploadedNote',
      required: false,
    },
  },
  { timestamps: true }
);

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
