// src/models/Note.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface INote extends Document {
    title: string;
    content: string;
    user: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const noteSchema = new Schema<INote>({
    title: {
        type: String,
        required: [true, 'Note title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    content: {
        type: String,
        required: [true, 'Note content is required'],
        maxlength: [5000, 'Content cannot exceed 5000 characters']
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    }
}, {
    timestamps: true
});

// Index for better performance
noteSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<INote>('Note', noteSchema);