import mongoose from "mongoose";
import Question from "../models/question.js";

// get all questions
export const getAllQuestions = async (req, res) => {

}

// ask a question
export const askQuestion = async (req, res) => {
    const { title, body, tags, author } = req.body;
    const isAuthorValid = mongoose.Types.ObjectId.isValid(author.id);
    if (!isAuthorValid) {
        return res.status(400).json({ status: 400, message: 'Author id is not valid.', data: null });
    }

    Question.create({ title, body, tags, author }).then((response) => {
        console.log(response)
        res.send('question posted successfully')
    }).catch((error) => {
        console.log(error)
        res.send('error ' + error)
    })
}

// delete question
export const deleteQuestion = async (req, res) => {

}

// upvote and downvote question
export const voteQuestion = async (req, res) => {

}