import User from '../models/auth.js'
import bycrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import Tokens from '../models/passwordresetToken.js'
import { getAuth } from 'firebase-admin/auth'
import { getDatabase } from 'firebase-admin/database'

export const signup = async (req, res) => {
    const { displayName, email, password } = req.body
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ status: 409, message: "User with this email already exist." })
        }
        const hashedPassword = await bycrypt.hash(password, 10)
        const fuid = (await getAuth().createUser({ email, password })).uid;
        const db = getDatabase()
        const user = db.ref(`/users/${fuid}`)
        user.set({ online: false, isOnCall: false, name: displayName, email: email,uid:fuid }).then(()=>{
            console.log('write new user')
        }).catch(err => console.log(err))
        const userAccount = await User.create({ displayName, email, password: hashedPassword, fuid })
        // eslint-disable-next-line no-undef
        const token = jwt.sign({ email, id: userAccount._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const profile = {
            _id: userAccount._id,
            tags: userAccount.tags,
            fuid: userAccount.fuid,
            about: userAccount.about,
            email: userAccount.email,
            location: userAccount.location,
            imageUrl: userAccount.imageUrl,
            joinedOn: userAccount.joinedOn,
            reputation: userAccount.reputation,
            displayName: userAccount.displayName,
            asnswerCount: userAccount.answerCount,
            questionCount: userAccount.questionCount,
        }
        res.status(200).json({ status: 200, message: 'User Account created successfully.', data: { token, profile } })

    } catch (error) {
        console.log(error)
        res.status(400).json({ status: 500, message: "Internal Server Error" })
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const userAccount = await User.findOne({ email })
        if (!userAccount) {
            return res.status(404).json({ status: 404, message: 'User with this email does not exist.' })
        }
        const isPasswordCrt = await bycrypt.compare(password, userAccount.password)
        if (!isPasswordCrt) {
            return res.status(401).json({ status: 401, message: 'Password is incorrect.' })
        }

        const profile = {
            _id: userAccount._id,
            fuid: userAccount.fuid,
            tags: userAccount.tags,
            email: userAccount.email,
            about: userAccount.about,
            imageUrl: userAccount.imageUrl,
            location: userAccount.location,
            joinedOn: userAccount.joinedOn,
            reputation: userAccount.reputation,
            displayName: userAccount.displayName,
            asnswerCount: userAccount.answerCount,
            questionCount: userAccount.questionCount,
        }
        // eslint-disable-next-line no-undef
        const token = jwt.sign({ email: userAccount.email, id: userAccount._id }, process.env.JWT_SECRET, { expiresIn: '1h' })
        res.status(200).json({ status: 200, message: 'Login succesfully', data: { token, profile } })
    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 500, message: 'Internal server error' })
    }
}

const sendEmail = async (email, token, deviceInfo) => {

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASS
        }
    });
    const res = await transporter.sendMail({
        from: `"Stackoverflow Clone" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: "Stackoverflow Clone Password Reset",
        html: `
        <!DOCTYPE html>
            <html lang="en">
                <head>
                     <meta charset="UTF-8">
                     <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Stackoverflow Clone</title>
                </head>
                <body style="text-align: center;">
                    <p style="font-size: larger; color: rgb(55, 55, 55);">We recived password reset request for your account.</p>
                    <p style="color: rgb(55, 55, 55);">If you don't request please ignore it.</p>
                    <div >
                         <p><span style="font-weight: 600; font-size: larger;">Location:</span> ${deviceInfo.location}</p>
                        <p><span style="font-weight: 600; font-size: larger;">IP address:</span> ${deviceInfo.ip}</p>
                    </div>
                    <a href="${process.env.FRONTEND_URL}/account/recover/${token}" style="width: fit-content; background-color: blue;color: white;padding: 3px 6px;border-radius: 4px;border: none; margin: 0 auto; display: block;cursor: pointer;text-decoration: none; ">Reset Password</a>
                </body>
            </html>
        `
    })
    return res
}

const base64urlEncoder = (input) => {
    return Buffer.from(input).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

export const forgetPassword = async (req, res) => {
    const { email, deviceInfo } = req.body;
    try {
        const userAccount = await User.findOne({ email })
        if (!userAccount) {
            return res.status(404).json({ status: 404, message: 'User Account Not Found.' })
        }
        const token = jwt.sign({ email, id: userAccount._id }, process.env.JWT_SECRET, { expiresIn: '5m' })
        await Tokens.findOneAndReplace({ email }, { email, token }, { upsert: true })
        const encodedToken = base64urlEncoder(token)
        await sendEmail(email, encodedToken, deviceInfo)
        res.status(200).json({ status: 200, message: 'Email Sent Successfully.' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 500, message: 'Internal Server Error.' })
    }
}

const base64urlDecoder = (input) => {
    input = input.replace(/-/g, '+').replace(/_/g, '/');
    while (input.length % 4) {
        input += '=';
    }
    return Buffer.from(input, 'base64').toString('utf-8');
}

export const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    const decodedToken = decodeURIComponent(base64urlDecoder(token))
    try {
        const storedToken = await Tokens.findOne({ token: decodedToken });
        if (!storedToken) {
            return res.status(404).json({ status: 404, message: 'Token used or expired.' });
        }
        try {
            const { id, email } = jwt.verify(decodedToken, process.env.JWT_SECRET)
            const userAccount = await User.findById(id);
            if (!userAccount) {
                return res.status(404).json({ message: 'user account not found' });
            }
            const hashedPassword = await bycrypt.hash(newPassword, 10)
            userAccount.password = hashedPassword
            await Tokens.findOneAndDelete({ email })
            await userAccount.save();
        } catch (error) {
            if (error.message === 'jwt expired') {
                return res.status(403).json({ status: 403, message: 'Session expired.' })
            }
            console.log(error.message);
            return res.status(500).json({ status: 500, message: "Internal Server Error." })
        }
        res.status(200).json({ status: 200, message: 'Password Reset successfully.' })
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
}