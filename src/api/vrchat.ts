import {get, jsendResponseSuccess, post} from "./index";
const prompt = require('prompt-sync')({sigint: true});

const baseURL = 'https://api.vrchat.cloud/api/1'

export type vrcUser = {
    id: string,
    displayName: string,
    bio: string,
    bioLinks: string[],
    developerType: string, // TODO: Find out exact values,
    currentAvatarImageUrl: string,
    currentAvatarThumbnailImageUrl: string,
    currentAvatarTags: string[], // TODO: find out exact tags,
    userIcon: string,
    profilePicOverride: string,
    imageUrl: string,
    last_login: string,
    status: 'active' | 'ask me',
    statusDescription: string,
    last_platform: string, // TODO: findout exact platforms,
    location: string | 'offline' | 'private',
    tags: string[], // TODO: figure out the tags,
    friendKey: string,
    isFriend: boolean
}

export async function authenticate(base64Auth: string) {
    const response = await get(`${baseURL}/auth/user`, {
        Authorization: `Basic ${base64Auth}`
    })

    if (response.status !== 'success' || !response.data) return response
    const data = response.data

    if (data.hasOwnProperty('requiresTwoFactorAuth')) {
        let passedTwoAuth = false

        while (!passedTwoAuth) {
            const totp = prompt('Enter 2F OTP: ')
            passedTwoAuth = await verifyTotp(totp)
        }

        return authenticate(base64Auth)
    }

    return response
}

export async function verifyTotp (code: string): Promise<boolean> {
    const response = await post(`${baseURL}/auth/twofactorauth/totp/verify`, { code })

    console.debug(response)

    if (response.status !== 'success' || !response.data) return false
    const data = response.data

    return data?.verified
}

export async function getFriends () {
    const response = await get(`${baseURL}/auth/user/friends`)

    if (response.status !== 'success' || !response.data) return response

    return {
        ...response,
        data: response.data as vrcUser[]
    } as jsendResponseSuccess
}
