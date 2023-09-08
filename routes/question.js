import express from 'express'
import { askQuestion, deleteQuestion, getAllQuestions, getQuestionById, voteQuestion } from '../controllers/question.js'
import auth from '../middlewares/auth.js'

const router = express.Router()

router.get('/all', getAllQuestions)
router.get('/:questionId',getQuestionById)
router.post('/ask', auth, askQuestion)
router.delete('/delete/:questionId', auth, deleteQuestion)
router.patch('/vote', auth, voteQuestion)

export default router