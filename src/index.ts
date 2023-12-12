import {authenticate} from "./api/vrchat";

let lastOnline: string[] = []

const delaySeconds = 60

async function main() {
    console.log(new Date, 'Checking for online peeps...')
    const tick = performance.now()
    const { data } = await authenticate('')

    if (!data) return

    const onlineFriends: string[] = data.onlineFriends

    const nowOnline: string[] = []

    onlineFriends.forEach(userID => {
        if (!lastOnline.includes(userID)) nowOnline.push(userID)
    })

    lastOnline = onlineFriends

    if (nowOnline.length) {
        console.log('New users online!')
        console.log(nowOnline.join(','))
    }

    const resultTick = performance.now() - tick

    console.log(`[Done ${resultTick.toFixed(2)}ms] Waiting ${delaySeconds}s...`)

    setTimeout(main, delaySeconds * 1000)
}

main()
