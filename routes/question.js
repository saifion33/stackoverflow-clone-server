import express from 'express'
import { askQuestion } from '../controllers/question.js'
import auth from '../middlewares/auth.js'

const router = express.Router()

router.post('/ask', auth, askQuestion)

export default router