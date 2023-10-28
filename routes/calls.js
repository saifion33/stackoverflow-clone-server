import express from 'express'
import { makeCall } from '../controllers/calls.js';
import auth from '../middlewares/auth.js'

const router =express.Router();

router.post('/makecall',auth,makeCall)

export default router