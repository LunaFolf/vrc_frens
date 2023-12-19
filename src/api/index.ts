import {existsSync, readFileSync, writeFileSync} from "fs";

export type jsendResponseGeneric = {
    status: 'success' | 'fail' | 'error',
    data?: { [key: string]: any },
    message?: string,
    code?: number
}

export type jsendResponseSuccess = {
    status: 'success',
    data: { [key: string]: any }
}

export type jsendResponseFail = {
    status: 'fail',
    data: { [key: string]: any }
}

export type jsendResponseError = {
    status: 'error',
    message: string,
    data?: { [key: string]: any },
    code?: number
}

export type basicHeaders = { [key: string]: string }

const cookies: string[] = _loadCookies()
const headers = {
    'user-agent': 'vrc_frens v1.0.0 by LunaFolf <luna@folf.io>',
    'Content-Type': 'application/json',
    'Cookie': 'auth=auth'
}

function _isCookieExpired(cookie: string): boolean {
    const expiry = cookie.split(';').map(s => s.trim().split('=')[1])[3]

    const expiryDate = new Date(expiry)
    const nowDate = new Date()

    return expiryDate <= nowDate
}

function _verifyCookieValidity(): void {
    if (!existsSync('cookies.temp')) return

    let parsedArray: string[] = []

    try {
        parsedArray = JSON.parse(readFileSync('cookies.temp').toString())
    } catch (err) {
        console.error(err)
        return
    }

    if (!Array.isArray(parsedArray)) return

    const filteredArray: string[] = parsedArray.filter(cookie => !_isCookieExpired(cookie))

    writeFileSync('cookies.temp', JSON.stringify(filteredArray))
}

_verifyCookieValidity()

function _loadCookies(): string[] {
    if (!existsSync('cookies.temp')) return []

    let parsedArray: string[] = []

    try {
        parsedArray = JSON.parse(readFileSync('cookies.temp').toString())
    } catch (err) {
        console.error(err)
        return []
    }

    if (!Array.isArray(parsedArray)) return []

    return parsedArray
}

function _getCookies(asArray: boolean = false) {
    const cookiesArray = cookies.map(cookie => cookie.split(';')[0])

    return asArray ? cookiesArray : cookiesArray.join('; ')
}

function _getHeaders() {
    return {
        cookie: _getCookies() as string,
        ...headers
    }
}

function _addCookies(newCookies: string[]) {
    cookies.push(...newCookies)

    writeFileSync('cookies.temp', JSON.stringify(cookies))
}

async function _handleResponse(response: Response): Promise<jsendResponseGeneric> {
    if (!response.ok) return {
        status: 'error',
        message: 'TODO: Write error message(s) - ' + response.statusText,
        data: {
            response,
            json: JSON.stringify(await response.json(), null, 2)
        },
        code: response.status
    } as jsendResponseError

    _addCookies(response.headers.getSetCookie())

    const data = await response.json()

    return {
        status: 'success',
        data
    } as jsendResponseSuccess
}

export async function get (url: string, newHeaders?: basicHeaders): Promise<jsendResponseGeneric> {
    const _headers: basicHeaders = _getHeaders()
    if (newHeaders) Object.keys(newHeaders).forEach(headerKey => _headers[headerKey] = newHeaders[headerKey])

    const response = await fetch(url, { method: 'GET', headers: _headers })

    return _handleResponse(response)
}

export async function post (url: string, body?: object, newHeaders?: basicHeaders) {
    const _headers: basicHeaders = _getHeaders()
    if (newHeaders) Object.keys(newHeaders).forEach(headerKey => _headers[headerKey] = newHeaders[headerKey])

    const bodyString = (body ? JSON.stringify(body) : '')

    // console.debug('[POST]', url, { _headers, body: bodyString })

    const response = await fetch(url, { method: 'POST', headers: _headers, body: bodyString })

    return _handleResponse(response)
}
