import {authenticate, getFriends, vrcUser} from "./api/vrchat";
require('dotenv').config()

const friends: vrcUser[] = []

let lastOnline: string[] = []

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

async function main(firstRun = true) {
    console.log(new Date, 'Checking for online peeps...')
    const tick = performance.now()
    const { data } = await authenticate('')

    if (!data) return

    if (firstRun) {
        const response = await getFriends()

        if (response.status === 'success' && response.data) {
            const users = response.data as vrcUser[]
            friends.push(...users)
        }
    }

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

        // const usersString = nowOnline.map(u => `**${u.displayName}**`).join(', ')
        // const message = `
        // <@131771596800131072>
        // ${usersString} just came online.
        // `

        // await sendDiscordMessage(message)

        nowOnline.forEach(user => {
            let pfp = user.userIcon || user.profilePicOverride || user.currentAvatarImageUrl
            sendDiscordMessage('<@131771596800131072> I\'m online!', {
                username: user.displayName,
                avatar_url: pfp
            })
        })
    }

    const resultTick = performance.now() - tick

    console.log(`[Done ${resultTick.toFixed(2)}ms] Waiting ${delaySeconds}s...`)

    setTimeout(main, delaySeconds * 1000)
}

main()
