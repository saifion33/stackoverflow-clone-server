import mongoose from 'mongoose';
import User from '../models/auth.js'

export const getAllUsers = async (req, res) => {
    User.find()
        .then(users => res.status(200).json({ status: 200, message: 'users get Successfully', data: users }))
        .catch(err => res.status(500).json({ status: 500, message: 'There was an error', error: err }))
}


export const updateUser = async (req, res) => {
    const { userId, name, tags, about } = req.body;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(401).json({ status: 404, message: 'User id is not valid', data: null })
    }
    const user = await User.findById(userId)

    if (user._id != userId) {
        return res.status(401).json({ status: 404, message: 'User do not have permission to update Profile', data: null })
    }

    User.findByIdAndUpdate(userId, {
        $set: { name, about, tags }
    }, { new: true })
        .then(user => res.status(200).json({ status: 200, message: 'Profile updated successfully', data: user }))
        .catch(err => res.status(500).json({ status: 500, message: 'There was an error', error: err }))

}

export const deleteUser = async (req, res) => {

}
