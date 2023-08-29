import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.js'
import questionRoutes from './routes/question.js'
import answerRoutes from './routes/answer.js'
import userRoutes from './routes/user.js'

const app = express();
// cofigure environment variables
dotenv.config()



// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 3000
// eslint-disable-next-line no-undef
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

app.use('/auth', authRoutes)
app.use('/question', questionRoutes)
app.use('/answer', answerRoutes)
app.use('/users', userRoutes)
