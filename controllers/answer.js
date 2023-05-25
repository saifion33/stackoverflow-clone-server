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
    const { questionId, answerId, userId } = req.body
    if (!(mongoose.Types.ObjectId.isValid(questionId))) {
        return res.status(400).json({ status: 400, message: 'Question ID is invalid', data: null })
    }
    if (!(mongoose.Types.ObjectId.isValid(userId))) {
        return res.status(400).json({ status: 400, message: 'User ID is invalid', data: null })
    }
    if (!(mongoose.Types.ObjectId.isValid(answerId))) {
        return res.status(400).json({ status: 400, message: 'Answer ID is invalid', data: null })
    }

    const question = await Question.findById(questionId)

    if (!question) {
        return res.status(404).json({ status: 404, message: 'Question not Found', data: null })
    }

    const isAnswerExists = question.answer.find(answer => answer._id == answerId)
    const isUserValid = question.answer.find(answer => answer.author.id === userId)
    if (!isAnswerExists) {
        return res.status(404).json({ status: 404, message: 'Answer not Found', data: null })
    }
    if (!isUserValid) {
        return res.status(401).json({ status: 401, message: 'User cannot delete this answer', data: null })
    }

    Question.findByIdAndUpdate(questionId, {
        $pull: { answer: { _id: answerId } },
        $inc: { noOfAnswers: -1 }

    }, { new: true })
        .then(newQuestion => res.status(200).json({ status: 200, message: 'Answer Deleted Successfully.', data: newQuestion }))
        .catch(err => res.status(500).json({ status: 500, message: 'Answer cannot be delete.', error: err.message }))

}