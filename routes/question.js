import express from 'express'
import { askQuestion, deleteQuestion, voteQuestion } from '../controllers/question.js'
import auth from '../middlewares/auth.js'

const router = express.Router()

router.post('/ask', auth, askQuestion)
router.delete('/delete', auth, deleteQuestion)
router.patch('/vote',voteQuestion)

export default router