import mongoose from "mongoose";

const QuestionSchema = mongoose.Schema({
    title: { type: String, required:true},
    description: { type: String, required:true},
    tags: { type: String, required:true },
    noOfAnswers: { type: Number, default: 0 },
    upVote: { type: [String], default: [] },
    downVote: { type: [String], default: [] },
    askedOn: { type: Date, default: Date.now},
    author: {
        _id: { type: String, required: true },
        displayName: { type: String, required:true},
        imageUrl: { type: String,default:null},
        reputation: { type: Number,required:true}
    }
})

export default mongoose.model("Question", QuestionSchema);