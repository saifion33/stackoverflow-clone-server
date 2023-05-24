import express from 'express'
import { askQuestion, deleteQuestion, getAllQuestions, voteQuestion } from '../controllers/question.js'
import auth from '../middlewares/auth.js'

const router = express.Router()

router.get('/all', getAllQuestions)
router.post('/ask', auth, askQuestion)
router.delete('/delete', auth, deleteQuestion)
router.patch('/vote', auth, voteQuestion)

export default router