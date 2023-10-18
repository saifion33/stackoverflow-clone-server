import express from 'express'
import auth from '../middlewares/auth.js';
import { setNotificationToken } from '../controllers/notification.js';

const router=express.Router();

router.patch('/setNotificationToken',auth,setNotificationToken)

export default router