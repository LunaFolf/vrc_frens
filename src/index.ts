import {authenticate, getFriends, vrcUser} from "./api/vrchat";
require('dotenv').config()
const prompt = require('prompt-sync')({sigint: true});

const friends: vrcUser[] = []
let lastOnline: string[] = []

let lastFailure: Date | null = null

const delaySeconds = 5
const webhookURL = process.env.DISCORD_WEBHOOK_URL || ''

type discordMessageOptions = {
    username?: string,
    avatar_url?: string
}

async function sendDiscordMessage(message: string, options?: discordMessageOptions) {
    await fetch(webhookURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            content: message,
            ...options
        })
    })
}

async function checkOnlineFriends(base64: string) {
    const tick = performance.now()
    try {
        const { data } = await authenticate(base64)

        if (!data) return

        const onlineFriends: string[] = data.onlineFriends
        const nowOnline: vrcUser[] = []

        onlineFriends.forEach(userID => {
            if (!lastOnline.includes(userID)) {
                const friendData = friends.find(user => {
                    return user.id === userID
                })
                if (friendData) nowOnline.push(friendData)
                else console.error('Unable to find friend data for', userID)
            }
        })

        lastOnline = onlineFriends

        if (nowOnline.length) {
            console.log('New users online!')
            console.log(nowOnline.map(u => u.displayName).join(', '))

            nowOnline.forEach(user => {
                let pfp = user.userIcon || user.profilePicOverride || user.currentAvatarImageUrl
                sendDiscordMessage('<@131771596800131072> I\'m online!', {
                    username: user.displayName,
                    avatar_url: pfp
                })
            })
        }

        const resultTick = performance.now() - tick

        console.log(`[Checked friends in ${resultTick.toFixed(2)}ms] Waiting ${delaySeconds}s...`)

        setTimeout(() => checkOnlineFriends(base64), delaySeconds * 1000)
    } catch (error) {
        const nowTime = new Date()

        console.warn('Something went wrong:')
        console.error(error)

        const crashedRecently = lastFailure ? ((nowTime.getTime() - lastFailure.getTime()) >= 10000) : false
        lastFailure = nowTime

        if (!crashedRecently) {
            console.log('Waiting 10s then retrying')
            setTimeout(() => checkOnlineFriends(base64), 10 * 1000)
        } else {
            console.error('Crashed recently in last 10 seconds, stopping now.')
            process.exit(-1)
        }
    }
}

;(async () => {
    const email = prompt('Enter email: ')
    const password = prompt.hide('Enter password: ')
    const base64: string = btoa(`${email}:${password}`)

    const { data } = await authenticate(base64)

    if (!data) return

    const friendsResponse = await getFriends()
    if (friendsResponse.status === 'success' && friendsResponse.data) {
        const users = friendsResponse.data as vrcUser[]
        friends.push(...users)
    }

    checkOnlineFriends(base64);
})();
