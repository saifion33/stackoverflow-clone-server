import User from '../models/auth.js'
import bycrypt from 'bcryptjs'
export const signup = async (req, res) => {
    const { name, email, password, about, tags } = req.body

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('user already exists')
            return res.status(409).json({ status: 409, message: "User with this email already exist.", data: null })
        }
        const hashedPassword = await bycrypt.hash(password, 10)
        const user = await User.create({ name, email, hashedPassword, about, tags })
        res.status(200).json({ status: 200, message: 'User Account created successfully.', data: user })

    } catch (error) {
        res.status(400).json({ status: 500, message: "Error creating user Plese check if you provide all required field", error })
    }
}