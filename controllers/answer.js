import mongoose from "mongoose";
import Answer from "../models/answer.js"
import User from "../models/auth.js"

export const postAnswer = async (req, res) => {
    const { questionId, questionAuthorId, answerBody } = req.body;
    const userId = req.userId;
    if (!(mongoose.Types.ObjectId.isValid(questionId))) {
        return res.status(400).json({ status: 400, message: 'Question ID is invalid' })
    }
    if (!(mongoose.Types.ObjectId.isValid(userId))) {
        return res.status(400).json({ status: 400, message: 'User ID is invalid' })
    }

    try {
        const userAccount = await User.findById(userId)
        if (!userAccount) {
            return res.status(404).json({ status: 404, message: 'User account not found' })
        }
        userAccount.reputation += 5;
        // Check if answer author reputation is greater then 60 and user don't have SILVER "Master" badge if not then give one .
        // or reputation is greater then 100 and user don't have GOLD "Professor" badge. if not then give one .
        if (userAccount.reputation >= 60) {
            userAccount.badges.map(badge => {
                if (badge.name === 'silver' && !badge.badgesList.includes('Master')) {
                    badge.badgesList.push('Master')
                }
            })
        } else if (userAccount.reputation >= 100) {
            userAccount.badges.map(badge => {
                if (badge.name === 'gold' && !badge.badgesList.includes('Professor')) {
                    badge.badgesList.push('Professor')
                }
            })
        }
        userAccount.answerCount += 1;
        const { _id, displayName, reputation, imageUrl } = userAccount
        const author = { _id, displayName, reputation, imageUrl }
        const answer = { body: answerBody, author, answerOf: questionId }

        // find question object and push answer to it if not found create new one
        const allAnswers = await Answer.findOneAndUpdate({ questionId, questionAuthorId }, {
            $push: { answers: answer }
        }, { new: true, upsert: true })
        const newAnswer = allAnswers.answers[allAnswers.answers.length - 1]
        await userAccount.save()
        res.status(200).json({ status: 200, message: 'Answer posted successfully', data: newAnswer })
    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 500, message: 'Internal Server Error' })
    }
}

export const getAllAnswers = async (req, res) => {
    const questionId = req.params.questionId;
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
        return res.status(400).json({ status: 400, message: 'Invalid question id.' })
    }
    try {
        const answers = await Answer.findOne({ questionId })
        if (!answers) {
            return res.status(404).json({ status: 404, message: 'Answers not found.' })
        }
        res.status(200).json({ status: 200, message: 'Answers get Successfully.', data: answers })

    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 500, message: 'Internal server error' })
    }
}

export const acceptAnswer = async (req, res) => {
    const { questionAuthorId, questionId, answerId, answerAuthorId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
        return res.status(400).json({ status: 400, message:'Invalid question id'});
    }
    if (!mongoose.Types.ObjectId.isValid(questionAuthorId)) {
        return res.status(400).json({ status: 400, message:'Invalid question author id'});
    }
    if (!mongoose.Types.ObjectId.isValid(answerId)) {
        return res.status(400).json({ status: 400, message:'Invalid answer id'});
    }
    if (!mongoose.Types.ObjectId.isValid(answerAuthorId)) {
        return res.status(400).json({ status: 400, message:'Invalid answer author id'});
    }

    try {
        const response = await Promise.all([
            await Answer.findOne({ questionId }),
            await User.findById(answerAuthorId),
            await User.findById(questionAuthorId)
        ])
        const answersList = response[0]
        const answerAuthor = response[1]
        const questionAuthor = response[2]
        const answer = answersList.answers.find(answer => answer._id == answerId)
        // set isAccepted to true
        answer.isAccepted = true;
        // increase answer author reputation by 10
        answerAuthor.reputation += 10;
        // increase answer author accepted answer count by 1
        answerAuthor.acceptedAnswerCount += 1;
    
        // Check if answer author accepted answer count is 10 if yes then give "Accepter" badge to answer author.
        if (answerAuthor.acceptedAnswerCount === 10) {
            answerAuthor.badges.map(badge => {
                if (badge.name === 'gold' && !badge.badgesList.includes('Accepter')) {
                    badge.badgesList.push('Accepter')
                }
            })
        }
        // Check if answer author reputation is greater then 60 and user don't have SILVER "Master" badge if not then give one .
        // or reputation is greater then 100 and user don't have GOLD "Professor" badge. if not then give one .
        if (answerAuthor.reputation >= 100) {
            answerAuthor.badges.map(badge => {
                if (badge.name === 'silver' && !badge.badgesList.includes('Master')) {
                    badge.badgesList.push('Master')
                }
            })
        } else if (answerAuthor.reputation >= 200) {
            answerAuthor.badges.map(badge => {
                if (badge.name === 'gold' && !badge.badgesList.includes('Professor')) {
                    badge.badgesList.push('Professor')
                }
            })
        }
        // increase question author reputation by 4 .
        questionAuthor.reputation += 4;
        // Check if question author reputation is greater then 60 and user don't have SILVER "Master" badge if not then give one .
        // or reputation is greater then 100 and user don't have GOLD "Professor" badge. if not then give one .
        if (questionAuthor.reputation >= 100) {
            questionAuthor.badges.map(badge => {
                if (badge.name === 'silver' && !badge.badgesList.includes('Master')) {
                    badge.badgesList.push('Master')
                }
            })
        } else if (questionAuthor.reputation >= 200) {
            questionAuthor.badges.map(badge => {
                if (badge.name === 'gold' && !badge.badgesList.includes('Professor')) {
                    badge.badgesList.push('Professor')
                }
            })
        }
    
        await Promise.all([
            await answerAuthor.save(),
            await questionAuthor.save(),
            await answersList.save(),
        ])
        res.status(200).json({ status: 200, message: 'All Good'})
    } catch (error) {
        console.log(error)
        res.status(500).json({status: 500, message:'Internal Server Error'})
    }
}

export const deleteAnswer = async (req, res) => {
    const { questionId, answerId } = req.body
    const userId = req.userId;
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
        return res.status(401).send({ status: 401, message: 'Invalid question id.' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(401).send({ status: 401, message: 'Invalid user id.' });
    }
    if (!mongoose.Types.ObjectId.isValid(answerId)) {
        return res.status(401).send({ status: 401, message: 'Invalid answer id.' });
    }
    try {
        const answerList = await Answer.findOne({ questionId })

        if (!answerList) {
            return res.status(404).json({ status: 404, message: 'Question of this answer not found. please check question id.' });
        }
        const isAnswerExist = answerList.answers.find(answer => answer._id ==answerId)
        if (!isAnswerExist) {
            return res.status(404).json({ status: 404, message: 'Answer not found.' });
        }
        answerList.answers = answerList.answers.filter(answer => answer.id !== answerId)
        await User.findByIdAndUpdate(userId, {
            $inc: { answerCount: -1,reputation:-5},
        })
        answerList.save();
        res.status(200).json({ status: 200, message: 'Answer deleted successfully.' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
}