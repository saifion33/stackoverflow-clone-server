import axios from 'axios';
import { getDatabase } from 'firebase-admin/database'
import User from '../models/auth.js'
import shortid from 'shortid';

export const makeCall = async (req, res) => {
    const userId = req.userId;
    const { to,callType} = req.body;
    const user = await User.findById(userId);
    if (!user || !to) {
        return res.status(404).json({ message: 'User not found' });
    }
    const callerStatusRef = getDatabase().ref(`/calls/${user.fuid}/status`)
    const callRequestRef = getDatabase().ref(`/calls/${to}/callRequest`)
    const receiverStatusRef = getDatabase().ref(`/calls/${to}/status`)
    const onGoingCallRef = getDatabase().ref(`/calls/${to}/onGoingCall`)
    callerStatusRef.set('waiting').catch(err => console.log(err));
    receiverStatusRef.get().then(async (snap) => {
        if (snap.val() === 'busy' || snap.val() === 'waiting') {
            return res.status(409).json({ message: 'user is busy' });
        }
        receiverStatusRef.set('waiting').catch(err => console.log(err));
        callerStatusRef.set('waiting').catch(err => console.log(err));
        const callId=shortid.generate();
        const callToken=await (await axios.get(`https://agora-token-server-gafs.onrender.com/rtc/${callId}/publisher/uid/0/`)).data.rtcToken;
        callRequestRef.set({callerId: user.fuid, callerName: user.displayName, callState: 'default',callId,callToken,callType});
        setTimeout(async () => {
            const onGoingCall = await (await onGoingCallRef.get()).val()
            callRequestRef.set({}).catch(err=>console.log(err));
            if (!onGoingCall) {
                receiverStatusRef.set('idle').catch(err => console.log(err));
                callerStatusRef.set('idle').catch(err => console.log(err));
            }
        }, 1000 * 30)
        res.status(200).json({ message: 'making call...',callData:{callId,callToken}});
    }).catch((err) => {
        console.log(err)
        res.status(500).json({ message: 'Internal Server error.'});
    });

}

