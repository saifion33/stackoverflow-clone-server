import express from 'express'
import { deleteAnswer, postAnswer } from '../controllers/answer.js'
import auth from '../middlewares/auth.js'

const router = express.Router()

router.patch('/post', auth, postAnswer)
router.patch('/delete', auth, deleteAnswer)

export default router