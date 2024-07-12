import type { HttpContext } from '@adonisjs/core/http'
import OTPService from '#services/otp_service'
import { sendError, sendSuccess } from '../utils.js'
import { createRegistrationValidator } from '#validators/register'
import { createLoginValidator } from '#validators/login'
import { createEmailVerificationValidator } from '#validators/email_verification'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
export default class UsersController {

    constructor(
         protected otpService:OTPService
    ){}

    async register({request,response}:HttpContext){
        try {
            await request.validateUsing(createRegistrationValidator)
            const {
                firstname,
                lastname,
                email,
                password,
                phone_number
            } = request.body()

            await db.transaction(async(client)=>{
                //Create account
                const user = await User.create({firstname,lastname,email,password,phone_number},{client})
                //Generate Email verification code
                const verificationOTP = await this.otpService.genRedisCode({user_id:user.id,code_type:'email_verification'})
                //TODO::Send this mail to the user's email address

                return sendSuccess(response,{message:'Account created successfuly',data:{...user,password:'****'}})
            })
        } catch (error) {
            return sendError(response,{code:500,error:error,message:error.message})
        }

    }

    async resendEmailVerificationCode({request,response}:HttpContext){
        try {
            const { email } = request.params()
            const user = await User.findBy('email',email)
           if(user){
            const prevOTP = await this.otpService.getRedisCode({user_id:user.id,code_type:'email_verification'})
            if(prevOTP){
                return sendSuccess(response,{message:'Please use the link already sent to your email'})
            }else{
                const verificationOTP = await this.otpService.genRedisCode({user_id:user.id,code_type:'email_verification'})
                //TODO::Send this mail to the user's email address
                return sendSuccess(response,{message:'An email verification link has been sent to your email'})
            }
           }else{
            return sendError(response,{message:'Account not found',code:404})
           }
        } catch (error) {
            return sendError(response,{code:500,error:error,message:error.message})
        }
    }

    async registerOtherSource({}:HttpContext){

    }

    async login({request,response}:HttpContext){
        try {
            await request.validateUsing(createLoginValidator)
            const { email, password } = request.body()
            const user = await User.verifyCredentials(email,password)
            if (user){
                if(!user.email_verified){
                    const prevOTP = await this.otpService.getRedisCode({user_id:user.id,code_type:'email_verification'})
                    if(prevOTP){
                        return sendSuccess(response,{message:'Please use the link already sent to your email'})
                    }else{
                        const verificationOTP = await this.otpService.genRedisCode({user_id:user.id,code_type:'email_verification'})
                        //TODO::Send this mail to the user's email address
                        return sendSuccess(response,{message:'An email verification link has been sent to your email'})
                    } 
                }
                const token = await User.accessTokens.create(user)
                return sendSuccess(response,{message:"Login Success", data:token})
            }else{
                return sendError(response,{message:'Authentication error', code:401})
            }
        } catch (error) {
            return sendError(response,{code:500,error:error,message:error.message})
        }
    }

    async loginOtherSource({request,auth,response}:HttpContext){
        try {
            
        } catch (error) {
            return sendError(response,{code:500,error:error,message:error.message})
        }
    }

    async verifyEmail({request,response}:HttpContext){
        try {
            await request.validateUsing(createEmailVerificationValidator)
            const { email, verification_code } = request.body()
            const user = await User.findBy('email',email)
            if(user){
                const prevOTP = await this.otpService.getRedisCode({user_id:user.id,code_type:'email_verification'})
                if(prevOTP && prevOTP === verification_code){
                    user.email_verified = true
                    user.email_verified_at = new Date()
                    await user.save()
                    return sendSuccess(response,{message:"Email Verification successful"})
                }else{
                    return sendError(response,{message:'Invalid or expired token', code:403})
                }
            }else{
                return sendError(response,{message:'Account not found', code:404})
            }
        } catch (error) {
            return sendError(response,{code:500,error:error,message:error.message})
        }
    }

    async forgotPasswordRequest({request,response}:HttpContext){
        try {
            const { email } = request.params()
            const user = await User.findBy('email',email)
            if(user){
                if(!user.email_verified){
                    const prevOTP = await this.otpService.genRedisCode({user_id:user.id,code_type:'email_verification'})
                    //TODO::SEND EMAIL
                    return sendSuccess(response,{message:'Please verify your email address before this action.'})
                }else{
                    const prevOTP = await this.otpService.getRedisCode({user_id:user.id,code_type:'password_reset'})
                    if(prevOTP){
                        //send the OTP
                        return sendSuccess(response,{message:'Password reset OTP sent'})
                    }
                }
            }else{
                return sendError(response,{code:404,message:'Account not found'})
            }
        } catch (error) {
            return sendError(response,{code:500,error:error,message:error.message})
        }
    }

    async resetPassword({request,response}:HttpContext){
        try {
            const { password,token,email } = request.body()
            const user = await User.findBy('email',email)
            if(user){
                const prevOTP = await this.otpService.getRedisCode({user_id:user.id,code_type:'password_reset'})
                if(prevOTP && prevOTP === token){
                    user.password = password
                    await user.save()
                    return sendSuccess(response,{message:'Password reset successful'})
                }else{
                    return sendError(response,{message:'Invalid or expired token', code:400})
                }
            }else{
                return sendError(response,{message:'Invalid account', code:400})
            }
        } catch (error) {
            return sendError(response,{message: error.message, code:500})
        }
    }

    async logout({response,auth}:HttpContext){
        try {
            const user = auth.use('api').user
            if(user){
                await User.accessTokens.delete(user,user.currentAccessToken.identifier)
            }else{
                return sendError(response,{message:'Unauthorized', code:401})
            }
        } catch (error) {
            return sendError(response,{message: error.message, code:500})
        }
    }

    async profile({}:HttpContext){

    }
}