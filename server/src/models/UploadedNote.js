import mongoose from 'mongoose';

const uploadedNoteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const UploadedNote = mongoose.model('UploadedNote', uploadedNoteSchema);
export default UploadedNote;
