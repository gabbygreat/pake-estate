import redis from "@adonisjs/redis/services/main";
import { randomString } from "../utils.js";

interface CodeType {
        user_id:string,
        code_type: 'email_verification'|'password_reset'|'login_otp',
        time_to_live?:number
}

const codeTypes = {
    email_verification:'EMV',
    password_reset:'PWDRST',
    login_otp:'LGNOTP'
}

export default class OTPService{

    async genRedisCode({user_id,code_type,time_to_live}:CodeType){
        const randString = randomString()
        try {
            await redis.setex(`${codeTypes[code_type]}_${user_id}`,time_to_live || (60*10),randString)//String will last 10minutes before expiration
            return randString
        } catch (error) {
            throw new Error('Could not connect to in-memory database')
        }
    }

    async getRedisCode({user_id,code_type}:CodeType){
        try {
            const randString = await redis.get(`${codeTypes[code_type]}_${user_id}`)
            return randString
        } catch (error) {
            throw new Error('Could not connect to in-memory database')
        }
    }



}