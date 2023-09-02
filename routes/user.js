import express from 'express';
import { deleteUser, getAllUsers, getUserById, updateUser } from '../controllers/user.js';
import auth from '../middlewares/auth.js';
import multer from 'multer';


const storage=multer.memoryStorage()
const upload=multer({storage:storage})

const router = express.Router();

router.get('/all', getAllUsers)
router.get('/:id',getUserById)
router.patch('/update', auth,upload.any(), updateUser)
router.delete('/delete', auth, deleteUser)

export default router