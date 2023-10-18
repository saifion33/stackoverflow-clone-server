
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import admin from 'firebase-admin'

import { initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging'
import authRoutes from './routes/auth.js'
import questionRoutes from './routes/question.js'
import answerRoutes from './routes/answer.js'
import userRoutes from './routes/user.js'
import notificationRouter from './routes/notification.js'

const credential = admin.credential;

const app = express();
// cofigure environment variables
dotenv.config()


const PORT = process.env.PORT || 3000
const DATABASE_URL = process.env.DATABASE_URL

mongoose.connect(DATABASE_URL).then(() => app.listen(PORT, () => {
    console.log(`Stackoverflow clone app listening on port ${PORT}`)
})).catch((err) => console.log(err))


app.use(express.json({ limit: '30mb', extended: true }))
app.use(express.urlencoded({ limit: '30mb', extended: true }))
app.use(cors());



app.get('/', (req, res) => {
    res.send('Stackoverflow server is Running...');
})

initializeApp({
    credential: credential.cert({
        "type": "service_account",
        "project_id": process.env.F_PROJECT_ID,
        "private_key_id": process.env.F_PRIVATE_KEY_ID,
        "private_key": process.env.F_PRIVATE_KEY,
        "client_email": process.env.F_CLIENT_EMAIL,
        "client_id": process.env.F_CLIENT_ID,
      }
      )
});


export const sendNotification = async (token, title, body) => {
    const message = {
        notification: { title, body },
        token
    };
    try {
        await getMessaging().send(message)
    } catch (error) {
        return error;
    }
}

app.use('/notifications',notificationRouter)
app.use('/questions', questionRoutes)
app.use('/answers', answerRoutes)
app.use('/users', userRoutes)
app.use('/auth', authRoutes)
