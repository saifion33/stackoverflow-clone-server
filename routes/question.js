import express from 'express'
import { askQuestion, deleteQuestion } from '../controllers/question.js'
import auth from '../middlewares/auth.js'

const router = express.Router()

router.post('/ask', auth, askQuestion)
router.delete('/delete', auth, deleteQuestion)

export default router