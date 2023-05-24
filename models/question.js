import mongoose from "mongoose";

const QuestionSchema = mongoose.Schema({
    title: { type: String, required: "Question must have a title" },
    body: { type: String, required: "Question must have a body" },
    tags: { type: [String], required: "Question must have Tag(s)" },
    noOfAnswers: { type: Number, default: 0 },
    upVote: { type: [String], default: [] },
    downVote: { type: [String], default: [] },
    askedOn: { type: Date, default: Date.now() },
    author: {
        name: { type: String, required: "Question must have Author" },
        id: { type: String, required: "Question must have user id" }

    },
    answer: [{
        body: String,
        author: {
            name: { type: String, required: "Answer mush have Author" },
            id: { type: String, required: "Answer must have user id" }
        },
        answeredOn: { type: Date, default: Date.now() }
    }]
})

export default mongoose.model("Question", QuestionSchema);