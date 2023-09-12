import express from 'express'
import { acceptAnswer, deleteAnswer, getAllAnswers, postAnswer, voteAnswer } from '../controllers/answer.js'
import auth from '../middlewares/auth.js'

const router = express.Router()

router.get('/all/:questionId',getAllAnswers)
router.patch('/post', auth, postAnswer)
router.delete('/delete', auth, deleteAnswer)
router.patch('/accept',auth,acceptAnswer)
router.patch('/vote',auth,voteAnswer)

export default router