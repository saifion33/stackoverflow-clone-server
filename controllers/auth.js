import User from '../models/auth.js'
import bycrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
export const signup = async (req, res) => {
    const { name, email, password, about, tags } = req.body

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('user already exists')
            return res.status(409).json({ status: 409, message: "User with this email already exist.", data: null })
        }
        const hashedPassword = await bycrypt.hash(password, 10)
        const user = await User.create({ name, email, password: hashedPassword, about, tags })
        res.status(200).json({ status: 200, message: 'User Account created successfully.', data: user })

    } catch (error) {
        res.status(400).json({ status: 500, message: "Error creating user Plese check if you provide all required field", error })
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email })
        if (!existingUser) {
            console.log('user not found')
            return res.status(404).json({ status: 404, message: 'User with this email does not exist.', data: null })
        }
        const isPasswordCrt = bycrypt.compare(password, existingUser.password)
        if (!isPasswordCrt) {
            return res.status(401).json({ message: 'Password is incorrect.' })
        }
        // eslint-disable-next-line no-undef
        const token = jwt.sign({ email: existingUser.email, id: existingUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' })

        res.status(200).json({ status: 200, message: 'Login succesfully', data: { token, user: existingUser } })

    } catch (error) {
        res.status(500).json({ status: 500, message: 'Something went wrong', error: error.message })
    }
}