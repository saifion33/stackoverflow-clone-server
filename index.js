import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'

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
