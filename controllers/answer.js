import mongoose from "mongoose";
import Question from "../models/question.js";

export const postAnswer = async (req, res) => {
    const { questionId, answer } = req.body;
    if (!(mongoose.Types.ObjectId.isValid(questionId))) {
        return res.status(400).json({ status: 400, message: 'Question ID is invalid', data: null })
    }
    if (!(mongoose.Types.ObjectId.isValid(answer.author.id))) {
        return res.status(400).json({ status: 400, message: 'User ID is invalid', data: null })
    }

    Question.findByIdAndUpdate(questionId, { $push: { answer: answer }, $inc: { noOfAnswers: 1 } }, { new: true })
        .then(question => res.status(200).json({ status: 200, message: 'Answer Posted Successfully', data: question }))
        .catch(err => res.status(500).json({ status: 500, message: 'Answers could not be Posted', error: err }))
}

export const deleteAnswer = async (req, res) => {
    res.send('delete answer is working...')
}