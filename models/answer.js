import mongoose from "mongoose";

const answerSchema = mongoose.Schema({
    questionId: { type: String, required: true },
    questionAuthorId: { type: String, required: true},
    answers: [{
        answerOf: { type: String, required: true },
        body: { type: String, required: true },
        upVote: { type: [String], default: [] },
        downVote: { type: [String], default: [] },
        answeredOn: { type: Date, default: Date.now },
        isAccepted: { type: Boolean, default:false},
        author: {
            _id: { type: String, required: true },
            displayName: { type: String, required: true },
            imageUrl: { type: String, default: null },
            reputation: { type: Number, required: true }
        }
    }]
})

export default mongoose.model('Answer', answerSchema);