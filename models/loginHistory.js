import { Schema, model } from 'mongoose'

const loginHistorySchema = Schema({
    userId: { type: String, required: true },
    loginHistory: [{
        ip: { type: String, required: true },
        browser: { type: String, required: true },
        deviceType: { type: String, required: true },
        os: { type: String, required: true },
        location: { type: String, required: true},
        loggedInAt: { type: Date, default: Date.now },
    }]
})

export default model('LoginHistory', loginHistorySchema)