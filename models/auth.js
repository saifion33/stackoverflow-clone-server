import mongoose from "mongoose";
import { Schema } from "mongoose";
const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String },
    about: { type: String },
    tags: { type: [String] },
    joinedOn: { type: Date, default: Date.now() }

})

export default mongoose.model('User', userSchema)