import express from 'express'
import { signup, login, forgetPassword, resetPassword, getLoginHistory } from '../controllers/auth.js'
import auth from '../middlewares/auth.js'

const router = express.Router()

router.post('/signup', signup)
router.post('/login', login)
router.get('/loginHistory',auth,getLoginHistory)
router.patch('/forgetPassword', forgetPassword)
router.patch('/resetPassword', resetPassword)
export default router