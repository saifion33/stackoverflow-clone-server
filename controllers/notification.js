import User from '../models/auth.js';
export const setNotificationToken=async(req,res)=>{
    const {token}=req.body;
    const userId=req.userId;
    try {
        const user=await User.findById(userId);
        if (!user) {
            return res.status(404).json({status:404,message:'User Account Not Found.'});
        }
        user.notificationId=token;
        await user.save();
        res.status(200).json({status:200,message:'User Notification Token set successfully.'});
    } catch (error) {
        console.log(error);
        res.status(500).json({status:500,message:'Internal Server Error.'});
    }
}