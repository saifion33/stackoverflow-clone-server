import mongoose from "mongoose";
import Question from "../models/question.js";

// get all questions
export const getAllQuestions = async (req, res) => {

}

// *****************************************************************************************************************
// ************************************************ ASK QUESTION ***************************************************
// *****************************************************************************************************************

export const askQuestion = async (req, res) => {
    const { title, body, tags, author } = req.body;

    // check if author id is a valid ID
    const isAuthorValid = mongoose.Types.ObjectId.isValid(author.id);
    if (!isAuthorValid) {
        return res.status(400).json({ status: 400, message: 'Author id is not valid.', data: null });
    }

    // Post question to database
    Question.create({ title, body, tags, author }).then((response) => {
        console.log(response)
        res.send('question posted successfully')
    }).catch((error) => {
        console.log(error)
        res.send('error ' + error)
    })
}

// *****************************************************************************************************************
// ************************************************ DELETE QUESTION ************************************************
// *****************************************************************************************************************

export const deleteQuestion = async (req, res) => {
    const { questionId, authorId } = req.body;

    // when questionId or authorId are not valid
    if (!(mongoose.Types.ObjectId.isValid(questionId) && mongoose.Types.ObjectId.isValid(authorId))) {
        return res.status(401).json({ status: 404, message: 'Invalid questionId or authorId' })
    }

    const question = await Question.findById(questionId)
    // when question not exist or not found by given id
    if (!question) {
        return res.status(404).json({ status: 404, message: 'Question not found', data: null })
    }

    // when author id not match authorId
    if (question.author.id !== authorId) {
        return res.status(403).json({ status: 403, message: `You don't have permission to delete this question`, data: null })
    }

    // delete question by given id
    Question.findByIdAndDelete(questionId).then(() => {
        res.status(200).json({ status: 200, message: 'Question deleted successfully', data: question })
    }).catch(err => {
        res.status(500).json({ status: 500, message: err.message, err })
    })
}

// *****************************************************************************************************************
// ************************************************ VOTE QUESTION **************************************************
// *****************************************************************************************************************

export const voteQuestion = async (req, res) => {
 
}