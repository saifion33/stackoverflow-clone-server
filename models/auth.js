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
    about: { type: String,default:'Nothing about me' },
    tags: { type: String ,default:null},
    location:{ type:String,default:'unknown' },
    reputation:{type:Number,default:0},
    imageUrl:{type:String,default:null},
    questionCount:{type:Number,default:0},
    answerCount:{type:Number,default:0},
    totalUpvotesByUser:{type:Number,default:0},
    acceptedAnswerCount:{type:Number,default:0},
    isAcceptAnswerFirstTime:{type:Boolean,default:true},
    badges:{type:[badgeSchema],default:[{name:'bronze',count:0,badgesList:[]},{name:'silver',count:0,badgesList:[]},{name:'gold',count:0,badgesList:[]}]},
    joinedOn: {type: Date, default: Date.now},
    notificationId: {type: String},
    fuid:{type: String, default:null}
})

export default mongoose.model('User', userSchema)

