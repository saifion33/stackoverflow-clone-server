import mongoose from "mongoose";
import Answer from "../models/answer.js"
import User from "../models/auth.js"
import { sendNotification } from "../index.js";
import Question from "../models/question.js";

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
        const question=await Question.findById(questionId);
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
        question.noOfAnswers+=1;
        await question.save();
        await userAccount.save();
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
    const userId = req.userId;
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
        return res.status(400).json({ status: 400, message: 'Invalid question id' });
    }
    if (!mongoose.Types.ObjectId.isValid(questionAuthorId)) {
        return res.status(400).json({ status: 400, message: 'Invalid question author id' });
    }
    if (!mongoose.Types.ObjectId.isValid(answerId)) {
        return res.status(400).json({ status: 400, message: 'Invalid answer id' });
    }
    if (!mongoose.Types.ObjectId.isValid(answerAuthorId)) {
        return res.status(400).json({ status: 400, message: 'Invalid answer author id' });
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
        if (questionAuthor._id.toString() !== userId) {
            return res.status(401).json({ status: 401, message: 'You are not allowed to accept this answer.' })
        }
        if (answer.author._id.toString() === questionAuthor._id.toString()) {
            return res.status(401).json({ status: 401, message: "you can't accept your own answer." });
        }
        // set isAccepted to true
        answer.isAccepted = true;
        // increase answer author reputation by 10
        answerAuthor.reputation += 10;
        // increase answer author accepted answer count by 1
        answerAuthor.acceptedAnswerCount += 1;
        if (answerAuthor.notificationId) {
            await sendNotification(answerAuthor.notificationId, `Congratulations ${answerAuthor.displayName}`, `${questionAuthor.displayName} accept your answer.`)
        }

        // Check if answer author accepted answer count is 10 if yes then give "Accepter" badge to answer author.
        if (answerAuthor.acceptedAnswerCount === 20) {
            answerAuthor.badges.map(async (badge) => {
                if (badge.name === 'gold' && !badge.badgesList.includes('Accepter')) {
                    badge.badgesList.push('Accepter')
                    if (answerAuthor.notificationId) {
                        await sendNotification(answerAuthor.notificationId, `Congratulations ${answerAuthor.displayName}`, `You get Accepter badge.`)
                    }
                }
            })
        }
        // Check if answer author reputation is greater then 200 and user don't have SILVER "Master" badge if not then give one .
        // or reputation is greater then 400 and user don't have GOLD "Professor" badge. if not then give one .
        if (answerAuthor.reputation >= 200) {
            answerAuthor.badges.map(async (badge) => {
                if (badge.name === 'silver' && !badge.badgesList.includes('Master')) {
                    badge.badgesList.push('Master')
                    if (answerAuthor.notificationId) {
                        await sendNotification(answerAuthor.notificationId, `Congratulations ${answerAuthor.displayName}`, `You get Master badge.`)
                    }
                }
            })
        } else if (answerAuthor.reputation >= 400) {
            answerAuthor.badges.map(async (badge) => {
                if (badge.name === 'gold' && !badge.badgesList.includes('Professor')) {
                    badge.badgesList.push('Professor')
                    if (answerAuthor.notificationId) {
                        await sendNotification(answerAuthor.notificationId, `Congratulations ${answerAuthor.displayName}`, `You get Professor badge.`)
                    }
                }
            })
        }
        // increase question author reputation by 4 .
        questionAuthor.reputation += 4;
        // Check if question author reputation is greater then 200 and user don't have SILVER "Master" badge if not then give one .
        // or reputation is greater then 400 and user don't have GOLD "Professor" badge. if not then give one .
        if (questionAuthor.reputation >= 200) {
            questionAuthor.badges.map(async (badge) => {
                if (badge.name === 'silver' && !badge.badgesList.includes('Master')) {
                    badge.badgesList.push('Master')
                    if (questionAuthor.notificationId) {
                        await sendNotification(questionAuthor.notificationId, `Congratulations ${questionAuthor.displayName}`, `You get Master badge.`)
                    }
                }
            })
        } else if (questionAuthor.reputation >= 400) {
            questionAuthor.badges.map(async (badge) => {
                if (badge.name === 'gold' && !badge.badgesList.includes('Professor')) {
                    badge.badgesList.push('Professor')
                    if (questionAuthor.notificationId) {
                        await sendNotification(questionAuthor.notificationId, `Congratulations ${questionAuthor.displayName}`, `You get Professor badge.`)
                    }
                }
            })
        }
        if (questionAuthor.isAcceptAnswerFirstTime) {
            questionAuthor.isAcceptAnswerFirstTime =false;
            questionAuthor.badges.map(async (badge) => {
                if (badge.name === 'bronze' && !badge.badgesList.includes('Scholar')) {
                    badge.count+=1;
                    badge.badgesList.push('Scholar');
                    if (questionAuthor.notificationId) {
                        await sendNotification(questionAuthor.notificationId, `Congratulations ${questionAuthor.displayName}`, `You get Scholar badge.`)
                    }
                }
            })
        }

        await Promise.all([
            await answerAuthor.save(),
            await questionAuthor.save(),
            await answersList.save(),
        ])
        res.status(200).json({ status: 200, message: 'All Good' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 500, message: 'Internal Server Error' })
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
        const isAnswerExist = answerList.answers.find(answer => answer._id == answerId)
        if (!isAnswerExist) {
            return res.status(404).json({ status: 404, message: 'Answer not found.' });
        }
        answerList.answers = answerList.answers.filter(answer => answer.id !== answerId)
        await User.findByIdAndUpdate(userId, {
            $inc: { answerCount: -1, reputation: -5 },
        })
        answerList.save();
        res.status(200).json({ status: 200, message: 'Answer deleted successfully.' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
}

export const voteAnswer = async (req, res) => {
    const { id: answerId, answerAuthorId, questionId, voteType } = req.body;
    const userId = req.userId;
    if (!mongoose.Types.ObjectId.isValid(answerId)) {
        return res.status(400).json({ status: 400, message: 'Invalid answer ID.' });
    }
    if (!mongoose.Types.ObjectId.isValid(answerAuthorId)) {
        return res.status(400).json({ status: 400, message: 'Invalid answer author ID.' });
    }
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
        return res.status(400).json({ status: 400, message: 'Invalid question ID.' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ status: 400, message: 'Invalid user ID.' });
    }
    try {
        const response = await Promise.all([
            await User.findById(userId),
            await User.findById(answerAuthorId),
        ])
        const user = response[0];
        const answerAuthor = response[1];
        if (!user) {
            return res.status(404).json({ status: 404, message: "user account not found." })
        }
        if (user._id.toString() === answerAuthor._id.toString()) {
            return res.status(401).json({ status: 401, message: "You can't vote your own answer" })
        }
        const answerList = await Answer.findOne({ questionId })
        if (!answerList) {
            return res.status(404).json({ status: 404, message: "May be User deleted Question." })
        }
        const answer = answerList.answers.find(answer => answer._id.toString() === answerId)
        if (!answer) {
            return res.status(404).json({ status: 404, message: "Answer not found." })
        }
        // check if upVote contains userId
        const upIndex = answer.upVote.findIndex(id => id === userId)
        // check if downVote contains userId
        const downIndex = answer.downVote.findIndex(id => id === userId)
        if (voteType === 'upVote') {

            // when downVote contains userId then remove it
            if (downIndex !== -1) {
                answer.downVote = answer.downVote.filter(id => id !== userId)
                answerAuthor.reputation += 2;
                answer.author.reputation += 2;
                user.reputation += 2;
            }
            // when upVote not contains userId then push userId into upVote Array
            if (upIndex === -1) {
                answer.upVote.push(userId)
                answerAuthor.reputation += 6;
                answer.author.reputation += 6;
                user.reputation += 2;
                user.totalUpvotesByUser += 1;
                if (answerAuthor.notificationId) {
                    await sendNotification(answerAuthor.notificationId, `Congratulations ${answerAuthor.displayName}`, `${user.displayName} upvote your answer.`)
                }

                if (answer.upVote.length >= 2) {
                    answerAuthor.badges.map(async (badge) => {
                        if (badge.name === 'bronze' && !badge.badgesList.includes('Teacher')) {
                            badge.count += 1;
                            badge.badgesList.push('Teacher');
                            if (answerAuthor.notificationId) {
                                await sendNotification(answerAuthor.notificationId, `Congratulations ${answerAuthor.displayName}`, `You get Teacher badge.`)
                            }
                        }
                    })
                } else if (answer.upVote.length >= 4) {
                    answerAuthor.badges.map(async (badge) => {
                        if (badge.name === 'bronze' && !badge.badgesList.includes('Nice Answer')) {
                            badge.count += 1;
                            badge.badgesList.push('Nice Answer');
                            if (answerAuthor.notificationId) {
                                await sendNotification(answerAuthor.notificationId, `Congratulations ${answerAuthor.displayName}`, `You get Nice Answer badge.`)
                            }
                        }
                    })
                }
                else if (answer.upVote.length >= 10) {
                    answerAuthor.badges.map(async (badge) => {
                        if (badge.name === 'silver' && !badge.badgesList.includes('Good Answer')) {
                            badge.count += 1;
                            badge.badgesList.push('Good Answer');
                            if (answerAuthor.notificationId) {
                                await sendNotification(answerAuthor.notificationId, `Congratulations ${answerAuthor.displayName}`, `You get Good Answer badge.`)
                            }
                        }
                    })
                }
                else if (answer.upVote.length >= 20) {
                    answerAuthor.badges.map(async(badge) => {
                        if (badge.name === 'gold' && !badge.badgesList.includes('Great Answer')) {
                            badge.count += 1;
                            badge.badgesList.push('Great Answer');
                            if (answerAuthor.notificationId) {
                                await sendNotification(answerAuthor.notificationId, `Congratulations ${answerAuthor.displayName}`, `You get Great Answer badge.`)
                            }
                        }
                    })
                }
                if (user.totalUpvotesByUser >= 15) {
                    user.badges.map(async(badge) => {
                        if (badge.name === 'silver' && !badge.badgesList.includes('Voter')) {
                            badge.count += 1;
                            badge.badgesList.push('Voter');
                            if (user.notificationId) {
                                await sendNotification(user.notificationId, `Congratulations ${user.displayName}`, `You get Voter badge.`)
                            }
                        }
                    })
                }

            } else {
                // when upVote contains userId then remove it
                answer.upVote = answer.upVote.filter(id => id !== userId)
                answerAuthor.reputation -= 6;
                answer.author.reputation -= 6;
                user.reputation -= 2;
                user.totalUpvotesByUser -= 1;
            }

        } else if (voteType === 'downVote') {
            // when upVote contains userId then remove it
            if (upIndex !== -1) {
                answer.upVote = answer.upVote.filter(id => id !== userId)
                answerAuthor.reputation -= 6;
                answer.author.reputation -= 6;
                user.reputation -= 2;
            }
            // when downVote not contains userId then push userId into downVote Array
            if (downIndex === -1) {
                answer.downVote.push(userId)
                answerAuthor.reputation -= 2;
                answer.author.reputation -= 2;
                user.reputation -= 2;
            } else {
                // when downVote contains userId then remove it
                answer.downVote = answer.downVote.filter(id => id !== userId)
                answerAuthor.reputation += 2;
                answer.author.reputation += 2;
                user.reputation += 2;
            }
        }
        if (answerAuthor.reputation >= 200) {
            answerAuthor.badges.map(async(badge) => {
                if (badge.name === 'silver' && !badge.badgesList.includes('Master')) {
                    badge.count += 1;
                    badge.badgesList.push('Master')
                    if (answerAuthor.notificationId) {
                        await sendNotification(answerAuthor.notificationId, `Congratulations ${answerAuthor.displayName}`, `You get Master badge.`)
                    }
                }
            })
        } else if (answerAuthor.reputation >= 400) {
            answerAuthor.badges.map(async(badge) => {
                if (badge.name === 'gold' && !badge.badgesList.includes('Professor')) {
                    badge.count += 1;
                    badge.badgesList.push('Professor')
                    if (answerAuthor.notificationId) {
                        await sendNotification(answerAuthor.notificationId, `Congratulations ${answerAuthor.displayName}`, `You get Professor badge.`)
                    }
                }
            })
        }
        if (user.reputation >= 200) {
            user.badges.map(async(badge) => {
                if (badge.name === 'silver' && !badge.badgesList.includes('Master')) {
                    badge.count += 1;
                    badge.badgesList.push('Master')
                    if (user.notificationId) {
                        await sendNotification(user.notificationId, `Congratulations ${user.displayName}`, `You get Master badge.`)
                    }
                }
            })
        } else if (user.reputation >= 400) {
            user.badges.map(async(badge) => {
                if (badge.name === 'gold' && !badge.badgesList.includes('Professor')) {
                    badge.count += 1;
                    badge.badgesList.push('Professor')
                    if (user.notificationId) {
                        await sendNotification(user.notificationId, `Congratulations ${user.displayName}`, `You get Professor badge.`)
                    }
                }
            })
        }
        try {
            await Promise.all([
                user.save(),
                answerAuthor.save(),
                answerList.save(),
            ])
            res.status(200).json({ status: 200, message: 'Vote updated successfully.' })
        } catch (error) {
            return res.status(500).json({ status: 500, message: "Internal Server Error." })
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: 500, message: 'Internal Server Error.' })
    }

}