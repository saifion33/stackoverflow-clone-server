import mongoose from 'mongoose';
import User from '../models/auth.js'

export const getAllUsers = async (req, res) => {
    try {
        const usersList= await User.find();

        const users=usersList.map(user=>{
            return ({_id:user._id,displayName:user.displayName,location:user.location,tags:user.tags,imageUrl:user.imageUrl,reputation:user.reputation})
        })
        return res.status(200).json({ status: 200, message: 'users get Successfully', data: users })
    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 500, message: 'internal Server Error' })
    }
}


export const updateUser = async (req, res) => {
    const { userId, name, tags, about } = req.body;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(401).json({ status: 404, message: 'User id is not valid', data: null })
    }
    const user = await User.findById(userId)

    if (user._id != req.userId) {
        return res.status(401).json({ status: 404, message: 'User do not have permission to update Profile', data: null })
    }

    User.findByIdAndUpdate(userId, {
        $set: { name, about, tags }
    }, { new: true })
        .then(user => res.status(200).json({ status: 200, message: 'Profile updated successfully', data: user }))
        .catch(err => res.status(500).json({ status: 500, message: 'There was an error', error: err }))

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
