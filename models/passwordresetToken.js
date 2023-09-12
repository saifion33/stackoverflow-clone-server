import mongoose from "mongoose";

const tokenSchema=mongoose.Schema({
    email:{type:String,required:true},
    token:{type:String,required:true},
    expiresAt:{type:Date,default:Date.now,expires:'5m'},
})

export default mongoose.model('Tokens',tokenSchema)