// src/controllers/notesController.ts
import { Request, Response } from 'express';
import Note from '../models/Note';



// Get all notes for the authenticated user
export const getNotes = async (req: Request, res: Response):Promise<any> => {
    try {
        const userId = req.user!._id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        // Get notes with pagination
        const notes = await Note.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
        const totalNotes = await Note.countDocuments({ user: userId });
        const totalPages = Math.ceil(totalNotes / limit);

        return res.status(200).json({
            success: true,
            data: {
                notes,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalNotes,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Error fetching notes:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch notes',
            error: error instanceof Error ? error.message : 'Internal Server Error'
        })
        
    }
   
};

// Get a single note by ID
export const getNoteById = async (req: Request, res: Response):Promise<any> => {
    try {
        const { id } = req.params;
        const userId = req.user!._id;

        const note = await Note.findOne({ _id: id, user: userId });

        if (!note) {
            return res.status(404).json({
                success: false, 
                message: 'Note not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: { note }
        });
    } catch (error) {
        console.error('Error fetching note:', error);
       return res.status(500).json({
            success: false,
            message: 'Failed to fetch note',
            error: error instanceof Error ? error.message : 'Internal Server Error'
        });
    }
    
};

// Create a new note
export const createNote = async (req: Request, res: Response):Promise<any> => {
    try {
        const { title, content } = req.body;
        const userId = req.user!._id;

        const note = await Note.create({
            title,
            content,
            user: userId
        });

        return res.status(201).json({
            success: true,
            message: 'Note created successfully',
            data: { note }
        });
    } catch (error) {
        console.error('Error creating note:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create note',
            error: error instanceof Error ? error.message : 'Internal Server Error'
        });
        
    }
   
};

// Update a note
export const updateNote = async (req: Request, res: Response):Promise<any> => {

    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const userId = req.user!._id;

        // Check if at least one field is provided
        if (!title && !content) {
            return res.status(400).json({
                success: false,
                message: 'Please provide at least one field to update (title or content)'
            });
        }

        const note = await Note.findOne({ _id: id, user: userId });

        if (!note) {
           return res.status(404).json({
               success: false,
               message: 'Note not found'
              });
        }

        // Update fields if provided
        if (title !== undefined) note.title = title;
        if (content !== undefined) note.content = content;

        await note.save();

        return res.status(200).json({
            success: true,
            message: 'Note updated successfully',
            data: { note }
        });
    } catch (error) {
        console.error('Error updating note:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update note',
            error: error instanceof Error ? error.message : 'Internal Server Error'
        });
        
    }
   
};

// Delete a note
export const deleteNote = async (req: Request, res: Response):Promise<any> => {
    try {
        const { id } = req.params;
        const userId = req.user!._id;

        const note = await Note.findOne({ _id: id, user: userId });
        console.log('mynote: ', note);
        if (!note) {
           return res.status(404).json({
               success: false,      
               message: 'Note not found'
            });
        }

        await Note.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: 'Note deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting note:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete note',
            error: error instanceof Error ? error.message : 'Internal Server Error'
        })
        
    }
    
};

// Delete multiple notes
export const deleteMultipleNotes = async (req: Request, res: Response):Promise<any> => {
    try {
        const { noteIds } = req.body;
        const userId = req.user!._id;

        if (!Array.isArray(noteIds) || noteIds.length === 0) {
           return res.status(400).json({
               success: false,             
               message: 'Please provide an array of note IDs to delete'
            });
        }

        // Delete notes that belong to the user
        const result = await Note.deleteMany({
            _id: { $in: noteIds },
            user: userId
        });

        return res.status(200).json({
            success: true,
            message: `${result.deletedCount} note(s) deleted successfully`,
            data: {
                deletedCount: result.deletedCount
            }
        });
    } catch (error) {
        console.error('Error deleting multiple notes:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete notes',
            error: error instanceof Error ? error.message : 'Internal Server Error'
        })
        
    }
  
};

// Search notes
export const searchNotes = async (req: Request, res: Response):Promise<any> => {
    try {
        const { q } = req.query;
        const userId = req.user!._id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        // Search in title and content using regex
        const searchRegex = new RegExp(q as string, 'i');

        const notes = await Note.find({
            user: userId,
            $or: [
                { title: { $regex: searchRegex } },
                { content: { $regex: searchRegex } }
            ]
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
        const totalNotes = await Note.countDocuments({
            user: userId,
            $or: [
                { title: { $regex: searchRegex } },
                { content: { $regex: searchRegex } }
            ]
        });

        const totalPages = Math.ceil(totalNotes / limit);

        return res.status(200).json({
            success: true,
            data: {
                notes,
                searchQuery: q,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalNotes,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });
     
    } catch (error) {
        console.error('Error searching notes:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to search notes',
            error: error instanceof Error ? error.message : 'Internal Server Error'
        })
    
        
    }
};

// Get notes statistics
export const getNotesStats = async (req: Request, res: Response):Promise<any> => {
    try {
        const userId = req.user!._id;

        const totalNotes = await Note.countDocuments({ user: userId });

        // Get notes created in the last 7 days
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const recentNotes = await Note.countDocuments({
            user: userId,
            createdAt: { $gte: lastWeek }
        });

        // Get the most recent note
        const latestNote = await Note.findOne({ user: userId })
            .sort({ createdAt: -1 })
            .select('title createdAt');

        return res.status(200).json({
            success: true,
            data: {
                totalNotes,
                recentNotes,
                latestNote
            }
        });
    } catch (error: any) {
        console.error('Error fetching notes stats:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message || 'Failed to fetch notes statistics'
           
        })
    }
   
};