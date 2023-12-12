import {get, post} from "./index";
const prompt = require('prompt-sync')({sigint: true});

const baseURL = 'https://api.vrchat.cloud/api/1'

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

async function verifyTotp (code: string): Promise<boolean> {
    const response = await post(`${baseURL}/auth/twofactorauth/totp/verify`, { code })

    console.debug(response)

    if (response.status !== 'success' || !response.data) return false
    const data = response.data

    return data?.verified
}
