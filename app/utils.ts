import { randomBytes } from 'crypto'
// import app from "@adonisjs/core/services/app";
// import { unlink } from "fs/promises";
//For Random string generation
export function randomString(length = 32) {
    return randomBytes(length).toString('hex');
}

export const timestamp = () => Math.floor(Date.now() / 1000);