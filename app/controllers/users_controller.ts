import type { HttpContext } from '@adonisjs/core/http'
import OTPService from '#services/otp_service'
export default class UsersController {

    constructor(
         protected otpService:OTPService
    ){}

    async register(){

    }

    async login(){

    }

    async verifyEmail(){

    }

    async forgotPasswordRequest(){

    }

    async resetPassword(){

    }

    async logout(){

    }

    async profile(){
        
    }
}