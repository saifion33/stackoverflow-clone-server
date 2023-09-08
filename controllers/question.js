import mongoose from "mongoose";
import Question from "../models/question.js";
import User from "../models/auth.js"
import Answer from "../models/answer.js"


// get all questions
export const getAllQuestions = async (req, res) => {
    try {
        const questionsList = await Question.find();

        const questions = await Promise.all(questionsList.map(async (question) => {
            const userAccount = await User.findById(question.author._id);
            if (userAccount) {
                const { _id, displayName, reputation, imageUrl } = userAccount.toObject()
                const updatedQuestion = { ...question.toObject(), author: { _id, displayName, reputation, imageUrl } }
                return updatedQuestion
            }
            return question
        }))
        res.status(200).json({ status: 200, message: 'Questions get Successfully.', data: questions })
    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 500, message: 'Internal Server Error' })
    }

}

// *****************************************************************************************************************
// ************************************************ ASK QUESTION ***************************************************
// *****************************************************************************************************************

export const askQuestion = async (req, res) => {
    const { title, description, tags, } = req.body;
    const userId = req.userId;
    // check if author id is a valid ID
    const isAuthorValid = mongoose.Types.ObjectId.isValid(userId);
    if (!isAuthorValid) {
        return res.status(400).json({ status: 400, message: 'Author id is not valid.', data: null });
    }
    try {
        const userAccount = await User.findById(userId)
        if (!userAccount) {
            return res.status(404).json({ status: 404, message: 'User Account Not Found' });
        }
        if (userAccount.questionCount === 0) {
            userAccount.reputation += 5;
        }
        userAccount.questionCount += 1;
        if (userAccount.questionCount === 2) {
            userAccount.badges.map(badge => {
                if (badge.name === 'bronze' && !badge.badgesList.includes('Student')) {
                    badge.badgesList.push('Student')
                    badge.count += 1;
                }
            })
        }
        if (userAccount.questionCount == 20) {
            userAccount.badges.map(badge => {
                if (badge.name === 'silver' && !badge.badgesList.includes('Knowledge Seeker')) {
                    badge.badgesList.push('Knowledge Seeker')
                    badge.count += 1;
                }
            })
        }
        await userAccount.save()
        const { _id, displayName, imageUrl, reputation } = userAccount
        const author = { _id, displayName, imageUrl, reputation }
        // Post question to database
        const response = await Question.create({ title, description, tags, author })

        res.status(200).json({ status: 200, message: 'Question Posted Successfully.', data: response })
    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 500, message: 'Internal Server Error' })
    }
}

// *****************************************************************************************************************
// ************************************************ GET QUESTION BY ID ************************************************
// *****************************************************************************************************************

export const getQuestionById = async (req, res) => {
    const questionId = req.params.questionId;
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
        return res.status(400).json({ status: 400, message: 'Invalid question id.' })
    }

    try {
        const question = await Question.findById(questionId)
        const userAccount = await User.findById(question.author._id)
        if (userAccount) {
            const { _id, displayName, imageUrl, reputation } = userAccount
            question.author = { _id, displayName, imageUrl, reputation }
        }
        if (!question) {
            return res.status(404).json({ status: 404, message: 'Question not found.' })
        }
        res.status(200).json({ status: 200, message: 'Question found.', data: question })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 400, message: 'Internal server error.' })
    }
}

// *****************************************************************************************************************
// ************************************************ DELETE QUESTION ************************************************
// *****************************************************************************************************************

export const deleteQuestion = async (req, res) => {
    const questionId  = req.params.questionId;
    const authorId = req.userId;
    // when questionId or authorId are not valid
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
        return res.status(401).json({ status: 404, message: 'Invalid questionId.' })
    }
    if (!mongoose.Types.ObjectId.isValid(authorId)) {
        return res.status(401).json({ status: 404, message: 'Invalid userId.' })
    }
    try {
        const question = await Question.findById(questionId)
        // when question not exist or not found by given id
        if (!question) {
            return res.status(404).json({ status: 404, message: 'Question not found' })
        }

        // when author id not match authorId
        if (question.author._id !== authorId) {
            return res.status(403).json({ status: 403, message: `You don't have permission to delete this question` })
        }
        await Question.findByIdAndDelete(questionId)
        await Answer.findOneAndDelete({questionId})
        const userAccount=await User.findById(authorId)
        userAccount.questionCount-=1;
        if (userAccount.questionCount==0) {
            userAccount.reputation-=5;
        }
        await userAccount.save();
        res.status(200).json({ status: 200, message:'Question deleted successfully.' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ status:500,message:'Internal Server Error.' })
    }
}

// *****************************************************************************************************************
// ************************************************ VOTE QUESTION **************************************************
// *****************************************************************************************************************

export const voteQuestion = async (req, res) => {
    const { questionId, voteType } = req.body;
    const userId = req.userId
    // check questionId and userId is valid ids or not
    const isIdsValid = mongoose.Types.ObjectId.isValid(questionId) && mongoose.Types.ObjectId.isValid(userId);
    if (!isIdsValid) {
        return res.status(403).json({ status: 403, message: 'questionId or userId is invalid', data: null })
    }


    try {
        const question = await Question.findById(questionId)

        // check if upVote contains userId
        const upIndex = question.upVote.findIndex(id => id === userId)
        // check if downVote contains userId
        const downIndex = question.downVote.findIndex(id => id === userId)

        // when voteType is upVote
        if (voteType === 'upVote') {

            // when downVote contains userId then remove it
            if (downIndex !== -1) {
                question.downVote = question.downVote.filter(id => id !== userId)
            }
            // when upVote not contains userId then push userId into upVote Array
            if (upIndex === -1) {
                question.upVote.push(userId)
            } else {
                // when upVote contains userId then remove it
                question.upVote = question.upVote.filter(id => id !== userId)
            }

        } else if (voteType === 'downVote') {
            // when upVote contains userId then remove it
            if (upIndex !== -1) {
                question.upVote = question.upVote.filter(id => id !== userId)
            }
            // when downVote not contains userId then push userId into downVote Array
            if (downIndex === -1) {
                question.downVote.push(userId)
            } else {
                // when downVote contains userId then remove it
                question.downVote = question.downVote.filter(id => id !== userId)
            }
        }

        // find question by id and update question
        Question.findByIdAndUpdate(questionId, question, { new: true }).then((question) => {
            res.status(200).json({ status: 200, message: `vote updated successfully`, data: question })
        }).catch(err => {
            res.status(500).json({ status: 500, message: 'error updating question', error: err })
        })

    }
    catch (err) {
        res.status(500).json({ status: 500, message: 'error updating question', error: err })
    }
}