import mongoose from 'mongoose';

const noteEmbeddingSchema = new mongoose.Schema(
  {
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UploadedNote',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    textChunk: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number], // Array of floats
      required: true,
    },
  },
  { timestamps: true }
);

const NoteEmbedding = mongoose.model('NoteEmbedding', noteEmbeddingSchema);
export default NoteEmbedding;
