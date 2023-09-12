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
    const questionId = req.params.questionId;
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
        await Answer.findOneAndDelete({ questionId })
        const userAccount = await User.findById(authorId)
        userAccount.questionCount -= 1;

        // check if it is user's last question if yes then -5 reputaion 
        if (userAccount.questionCount == 0) {
            userAccount.reputation -= 5;
        }

        await userAccount.save();
        res.status(200).json({ status: 200, message: 'Question deleted successfully.' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 500, message: 'Internal Server Error.' })
    }
}

// *****************************************************************************************************************
// ************************************************ VOTE QUESTION **************************************************
// *****************************************************************************************************************

export const voteQuestion = async (req, res) => {
    const { id: questionId, voteType } = req.body;
    const userId = req.userId
    // check questionId and userId is valid ids or not
    const isIdsValid = mongoose.Types.ObjectId.isValid(questionId) && mongoose.Types.ObjectId.isValid(userId);
    if (!isIdsValid) {
        return res.status(403).json({ status: 403, message: 'questionId or userId is invalid' })
    }
    try {
        const response = await Promise.all([
            await Question.findById(questionId),
            await User.findById(userId)
        ])
        const question = response[0];
        const user = response[1];
        if (question.author._id == user._id) {
            return res.status(401).json({ status: 401, message: "You can't vote your own question." })
        }
        const questionAuthor = await User.findById(question.author._id);

        // check if upVote contains userId
        const upIndex = question.upVote.findIndex(id => id === userId)
        // check if downVote contains userId
        const downIndex = question.downVote.findIndex(id => id === userId)

        // when voteType is upVote
        if (voteType === 'upVote') {

            // when downVote contains userId then remove it
            if (downIndex !== -1) {
                question.downVote = question.downVote.filter(id => id !== userId)
                questionAuthor.reputation += 2;
                question.author.reputation += 2;
                user.reputation += 2;
            }
            // when upVote not contains userId then push userId into upVote Array
            if (upIndex === -1) {
                question.upVote.push(userId)
                questionAuthor.reputation += 6;
                question.author.reputation += 6;
                user.reputation += 2;
                user.totalUpvotesByUser += 1;
                if (question.upVote.length >= 4) {
                    questionAuthor.badges.map(badge => {
                        if (badge.name === 'bronze' && !badge.badgesList.includes('Nice Question')) {
                            badge.count += 1;
                            badge.badgesList.push('Nice Question');
                        }
                    })
                }
                else if (question.upVote.length >= 10) {
                    questionAuthor.badges.map(badge => {
                        if (badge.name === 'silver' && !badge.badgesList.includes('Good Question')) {
                            badge.count += 1;
                            badge.badgesList.push('Good Question');
                        }
                    })
                }
                else if (question.upVote.length >= 20) {
                    questionAuthor.badges.map(badge => {
                        if (badge.name === 'gold' && !badge.badgesList.includes('Great Question')) {
                            badge.count += 1;
                            badge.badgesList.push('Great Question');
                        }
                    })
                }
                if (user.totalUpvotesByUser >= 15) {
                    user.badges.map(badge => {
                        if (badge.name === 'silver' && !badge.badgesList.includes('Voter')) {
                            badge.count += 1;
                            badge.badgesList.push('Voter');
                        }
                    })
                }

            } else {
                // when upVote contains userId then remove it
                question.upVote = question.upVote.filter(id => id !== userId)
                questionAuthor.reputation -= 6;
                question.author.reputation -= 6;
                user.reputation -= 2;
                user.totalUpvotesByUser -= 1;
            }

        } else if (voteType === 'downVote') {
            // when upVote contains userId then remove it
            if (upIndex !== -1) {
                question.upVote = question.upVote.filter(id => id !== userId)
                questionAuthor.reputation -= 6;
                question.author.reputation -= 6;
                user.reputation -= 2;
            }
            // when downVote not contains userId then push userId into downVote Array
            if (downIndex === -1) {
                question.downVote.push(userId)
                questionAuthor.reputation -= 2;
                question.author.reputation -= 2;
                user.reputation -= 2;
            } else {
                // when downVote contains userId then remove it
                question.downVote = question.downVote.filter(id => id !== userId)
                questionAuthor.reputation += 2;
                question.author.reputation += 2;
                user.reputation += 2;
            }
        }

        if (questionAuthor.reputation >= 200) {
            questionAuthor.badges.map(badge => {
                if (badge.name === 'silver' && !badge.badgesList.includes('Master')) {
                    badge.count += 1;
                    badge.badgesList.push('Master')
                }
            })
        } else if (questionAuthor.reputation >= 400) {
            questionAuthor.badges.map(badge => {
                if (badge.name === 'gold' && !badge.badgesList.includes('Professor')) {
                    badge.count += 1;
                    badge.badgesList.push('Professor')
                }
            })
        }
        if (user.reputation >= 200) {
            user.badges.map(badge => {
                if (badge.name === 'silver' && !badge.badgesList.includes('Master')) {
                    badge.count += 1;
                    badge.badgesList.push('Master')
                }
            })
        } else if (user.reputation >= 400) {
            user.badges.map(badge => {
                if (badge.name === 'gold' && !badge.badgesList.includes('Professor')) {
                    badge.count += 1;
                    badge.badgesList.push('Professor')
                }
            })
        }
        try {
            await Promise.all([
                await questionAuthor.save(),
                await user.save(),
                await Question.findByIdAndUpdate(questionId, question)
            ])
            res.status(200).json({ status: 200, message: `vote updated successfully` })
        } catch (error) {
            console.log(error)
            res.status(500).json({ status: 500, message: 'Internal Server Error.' })
        }

    }
    catch (error) {
        console.log(error)
        res.status(500).json({ status: 500, message: 'Internal Server Error.' })
    }
}