import mongoose from 'mongoose';
import User from '../models/auth.js'
import cloudinary from 'cloudinary'
import { Readable } from 'stream'


export const getAllUsers = async (req, res) => {
    try {
        const usersList = await User.find();

        const users = usersList.map(user => {
            return ({ _id: user._id, displayName: user.displayName, location: user.location, tags: user.tags, imageUrl: user.imageUrl, reputation: user.reputation })
        })
        return res.status(200).json({ status: 200, message: 'users get Successfully', data: users })
    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 500, message: 'internal Server Error' })
    }
}


export const updateUser = async (req, res) => {
    const userId = req.userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(404).json({ status: 404, message: 'User id is not valid' })
    }
    try {
        const user = await User.findById(userId)
        if (user._id != req.userId) {
            return res.status(401).json({ status: 401, message: 'User do not have permission to update Profile' })
        }
        if (req.files.length > 0) {
            cloudinary.v2.config({
                cloud_name: process.env.STORAGE,
                api_key: process.env.API_KEY,
                api_secret: process.env.API_SECRET
            })
            const fileBuffer = req.files[0].buffer;
            const stream = cloudinary.v2.uploader.upload_stream({ public_id: userId, resource_type: 'auto', folder: 'users profile' }, async (error, result) => {
                if (error) {
                    console.log(error.message)
                    res.status(500).json({ status: 500, message: error.message });
                    return
                }
                const imageUrl = result.url;
                const updates = { imageUrl, ...req.body };
                const userAccount = await User.findByIdAndUpdate(userId, updates, { new: true })
                const updatedValues = {
                    displayName: userAccount.displayName,
                    about: userAccount.about,
                    location: userAccount.location,
                    tags: userAccount.tags,
                    imageUrl: userAccount.imageUrl
                }
                res.status(200).json({ status: 200, message: 'User updated successfully', data: updatedValues })
            })
            const readStream = new Readable();
            readStream.push(fileBuffer)
            readStream.push(null)
            readStream.pipe(stream)
            return
        }

        const userAccount = await User.findByIdAndUpdate(userId, req.body, { new: true })
        const updatedValues = {
            displayName: userAccount.displayName,
            about: userAccount.about,
            location: userAccount.location,
            tags: userAccount.tags,
            imageUrl: userAccount.imageUrl
        }
        res.status(200).json({status:200,message:'User Profile updated successfully',data:updatedValues})

    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 500, message: 'Internal Server Error' })
    }

}

export const deleteUser = async (req, res) => {
    const { userId } = req.body;
    const user = await User.findById(userId)

    if (!user) {
        return res.status(404).json({ status: 404, message: 'User does not exist', data: null })
    }

    if (user._id != req.userId) {
        return res.status(401).json({ status: 401, message: 'User do not have permisson to delete account', data: null })
    }

    User.findByIdAndDelete(userId)
        .then(user => res.status(200).json({ status: 200, message: 'User Account deleted successfully', data: user }))
        .catch(err => res.status(500).json({ status: 500, message: 'There was an error', error: err }))
}

export const getUserById = async (req, res) => {
    const userId = req.params.id

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(404).json({ status: 404, message: 'Invalid user id' })
    }
    try {
        const userAccount = await User.findById(userId)
        if (userAccount) {
            // eslint-disable-next-line
            const { email, password, ...user } = userAccount.toObject()
            return res.status(200).json({ status: 200, message: 'User details get successfully', data: user })
        }
        res.status(404).json({ status: 404, message: 'User Not Found' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 500, message: 'Internal Server Error' })
    }
}