import express from 'express'
import { signup, login, forgetPassword, resetPassword } from '../controllers/auth.js'

const router = express.Router()

router.post('/signup', signup)
router.post('/login', login)
router.patch('/forgetPassword', forgetPassword)
router.patch('/resetPassword', resetPassword)
export default router