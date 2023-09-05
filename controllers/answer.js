import mongoose from "mongoose";
import Question from "../models/question.js";
import Answer from "../models/answer.js"
import User from "../models/auth.js"

export const postAnswer = async (req, res) => {
    const { questionId, answerBody} = req.body;
    const userId=req.userId;
    if (!(mongoose.Types.ObjectId.isValid(questionId))) {
        return res.status(400).json({ status: 400, message: 'Question ID is invalid'})
    }
    if (!(mongoose.Types.ObjectId.isValid(userId))) {
        return res.status(400).json({ status: 400, message: 'User ID is invalid'})
    }
    
    try {
        const userAccount=await User.findById(userId)
        if (!userAccount) {
            return res.status(404).json({ status: 404, message: 'User account not found'})
        }

        const {_id,displayName,reputation,imageUrl}=userAccount
        const author={_id,displayName,reputation,imageUrl}
        const answer={body:answerBody,author,answerOf:questionId}

        // find question object and push answer to it if not found create new one
        const allAnswers= await Answer.findOneAndUpdate({questionId}, {
            $push: { answers: answer }
        }, { new: true ,upsert: true})
        const newAnswer=allAnswers.answers[allAnswers.answers.length - 1]
        res.status(200).json({ status: 200, message: 'Answer posted successfully', data: newAnswer })
    } catch (error) {
        console.log(error)
        res.status(500).json({status:500,message:'Internal Server Error'})
    }
}

export const getAllAnswers=async(req,res) => {
    const questionId=req.params.questionId;
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
        return res.status(400).json({status:400,message:'Invalid question id.'})
    }
    try {
        const answers=await Answer.findOne({questionId})
        if (!answers) {
            return res.status(404).json({status:404,message:'Answers not found.'})
        }
        res.status(200).json({status:200,message:'Answers get Successfully.',data:answers})

    } catch (error) {
        console.log(error)
        res.status(500).json({status:500,message:'Internal server error'})
    }
}

export const deleteAnswer = async (req, res) => {
    const { questionId, answerId } = req.body
    if (!(mongoose.Types.ObjectId.isValid(questionId))) {
        return res.status(400).json({ status: 400, message: 'Question ID is invalid', data: null })
    }
    if (!(mongoose.Types.ObjectId.isValid(req.userId))) {
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
    const isUserValid = question.answer.find(answer => answer.author.id === req.userId)
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