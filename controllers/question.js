import mongoose from "mongoose";
import Question from "../models/question.js";

// get all questions
export const getAllQuestions = async (req, res) => {

    Question.find().then(questions =>
        res.status(200).json({ status: 200, message: 'Get all questions successfully', data: questions })
    ).catch(err => {
        res.status(500).json({ status: 500, message: 'There was an error.', error: err.message })
    })

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
    const { questionId, userId, voteType } = req.body;

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