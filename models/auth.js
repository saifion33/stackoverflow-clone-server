import mongoose from "mongoose";
import { Schema } from "mongoose";
const badgeSchema=new Schema({
    name:{type:String},
    count:{type:Number},
    badgesList:{type:[String]}
})
const userSchema = new Schema({
    displayName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String,required: true },
    about: { type: String },
    tags: { type: String },
    location:{ type:String,default:'unknown' },
    reputation:{type:Number,default:0},
    imageUrl:{type:String},
    questionCount:{type:Number,default:0},
    answerCount:{type:Number,default:0},
    badges:{type:badgeSchema},
    joinedOn: {type: Date, default: Date.now}
})

export default mongoose.model('User', userSchema)

