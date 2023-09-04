import mongoose from "mongoose";

const answerSchema = mongoose.Schema({
    answerOf: { type: String, required: true },
    body: { type: String, required: true },
    upVote: { type: [String], default: [] },
    downVote: { type: [String], default: [] },
    answeredOn: { type: Date, default: Date.now },
    author: {
        _id: { type: String, required: true },
        displayName: { type: String, required: true },
        imageUrl: { type: String,default:null },
        reputation: { type: Number, required: true }
    }
})

export default mongoose.Model('answer', answerSchema);