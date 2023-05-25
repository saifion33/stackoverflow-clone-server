import express from 'express';
import { deleteUser, getAllUsers, updateUser } from '../controllers/user.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.get('/all', getAllUsers)
router.patch('/update', auth, updateUser)
router.delete('/delete', auth, deleteUser)

export default router