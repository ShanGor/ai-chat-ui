// sum.test.js
import { expect, test } from 'vitest'
import { trimImageMeta } from './Utility'

test('trim image', () => {
    let img = ['data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...', 'hello world']
    let res = trimImageMeta(img)

    expect(res[0]).toBe('/9j/4AAQSkZJRgABAQEA...')
    expect(res[1]).toBe('hello world')
})

test('test meta', () => {
    expect(import.meta.env.VITE_API_URL).toBe('http://localhost:8080')
})