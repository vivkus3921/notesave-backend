// src/routes/notes.ts
import { Router } from 'express';
import {
    getNotes,
    getNoteById,
    createNote,
    updateNote,
    deleteNote,
    deleteMultipleNotes,
    searchNotes,
    getNotesStats
} from '../controllers/notesController';
import { validateNote, validateNoteUpdate } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(authenticateToken);

// Notes CRUD operations
router.get('/', getNotes);
router.get('/search', searchNotes);
router.get('/stats', getNotesStats);
router.get('/:id', getNoteById);
router.post('/', validateNote, createNote);
router.put('/:id', validateNoteUpdate, updateNote);
router.delete('/:id', deleteNote);
router.delete('/', deleteMultipleNotes);

export default router;