//import EmailService from '#services/email_service'
import LoginService from '#services/login_service'
import OTPService from '#services/otp_service'
// import OTPService from '../../app/services/otp_service'
import { createLoginValidator } from '#validators/login'
import { createAdminRegistrationValidator } from '#validators/register'
import { sendError, sendSuccess } from '../utils.js'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import EmailService, {
  //VerificationEmail,
  //WelcomeEmail,
  //ForgotPasswordEmail,
} from '#services/email_service'
//import env from '#start/env'

import Admin from '#models/admin'
import { HttpContext } from '@adonisjs/core/http'

@inject()
export default class AdminController {
  constructor(
    protected otpService: OTPService,
    protected loginService: LoginService,
    protected emailService: EmailService
  ) {}
  async login({ request, response }: HttpContext) {
    try {
      await request.validateUsing(createLoginValidator)
      const { email, password } = request.body()
      const admin = await Admin.verifyCredentials(email, password)
      if (admin) {
        const token = await Admin.accessTokens.create(admin)
        return sendSuccess(response, { message: 'Login Success', data: token })
      } else {
        return sendError(response, { message: 'Authentication error', code: 401 })
      }
    } catch (error) {
      return sendError(response, { code: 500, error: error, message: error.message })
    }
  }
  // async forgotPassword({ request, response }: HttpContext) {
  //   try {
  //     const { email } = request.params()
  //     const user = await Admin.findBy('email', email)
  //         console.log(user)   
  //     if (user) {
  //       if (!user.email_verified) {
  //         const prevOTP = await this.otpService.genRedisCode({
  //           user_id: user.id,
  //           code_type: 'email_verification',
  //         })
  //         await this.emailService
  //         .setTemplate<VerificationEmail>('email_verification', {
  //           firstname: user.fullname!,
  //           verification_url: `${env.get('WEBSITE_URL')}/verification?type=email-verification&email=${email}&token=${prevOTP}`,
  //         })
  //         .sendMail({
  //           subject: 'Email Verification',
  //           to: email,
  //           from: 'Pake Estate Management',
  //         })
  //         console.log("GOT HERE")
  //         return sendSuccess(response, {
  //           message: 'Please verify your email address before this action.',
  //         })
  //       } else {
  //         const prevOTP = await this.otpService.getRedisCode({
  //           user_id: user.id,
  //           code_type: 'password_reset',
  //         })
  //         console.log(prevOTP);
  //         if (prevOTP) {
  //           //console.log(`${env.get('WEBSITE_URL')}/verification?type=forgot-password&email=${email}&token=${prevOTP}`)
  //           await this.emailService
  //             .setTemplate<ForgotPasswordEmail>('forgot_password', {
  //               firstname: user.fullname!,
  //               otp_url: `${env.get('WEBSITE_URL')}/verification?type=forgot-password&email=${email}&token=${prevOTP}`,
  //             })
  //             .sendMail({
  //               subject: 'Forgot Password',
  //               to: email,
  //               from: 'Pake Estate Management',
  //             })
  //           return sendSuccess(response, { message: 'Password reset OTP already sent' })
  //         } else {
  //           const previousOTP = await this.otpService.genRedisCode({
  //             user_id: user.id,
  //             code_type: 'password_reset',
  //           })
  //          // console.log(`${env.get('WEBSITE_URL')}/verification?type=forgot-password&email=${email}&token=${previousOTP}`)

  //           await this.emailService
  //             .setTemplate<ForgotPasswordEmail>('forgot_password', {
  //               firstname: user.fullname!,
  //               otp_url: `${env.get('WEBSITE_URL')}/verification?type=forgot-password&email=${email}&token=${previousOTP}`,
  //             })
  //             .sendMail({
  //               subject: 'Forgot Password',
  //               to: email,
  //               from: 'Pake Estate Management',
  //             })
  //           return sendSuccess(response, { message: 'Password reset OTP sent' })
  //         }
  //       }
  //     } else {
  //       return sendError(response, { code: 404, message: 'Account not found' })
  //     }
  //   } catch (error) {
  //     return sendError(response, { code: 500, error: error, message: error.message })
  //   }
  // }
  async logout({ response, auth }: HttpContext) {
    try {
      const admin = auth.use('api_admin').user
      console.log(admin)
      if (admin) {
        await Admin.accessTokens.delete(admin, admin.currentAccessToken.identifier)
        return sendSuccess(response, { message: 'Logout Success' })
      } else {
        return sendError(response, { message: 'Unauthorized', code: 401 })
      }
    } catch (error) {
      return sendError(response, { message: error.message, code: 500 })
    }
  }
  async deleteAdmin({ request, response, auth }: HttpContext) {
    try {
      // Ensure the authenticated user is an admin
      const currentAdmin = auth.use('api_admin').user
      if (!currentAdmin) {
        return sendError(response, { message: 'Unauthorized', code: 401 })
      }

      // Extract the admin ID from the request
      const { id } = request.params()

      const admin = await Admin.find(id)
      if (!admin) {
        return sendError(response, { message: 'Admin not found', code: 404 })
      }

      await admin.delete()

      return sendSuccess(response, { message: 'Admin deleted successfully' })
    } catch (error) {
      return sendError(response, { message: error.message, code: 500 })
    }
  }
  async listAdmin({ response, auth }: HttpContext) {
    try {
      const currentAdmin = auth.use('api_admin').user
      if (!currentAdmin) {
        return sendError(response, { message: 'Unauthorized', code: 401 })
      }

      const list = await Admin.query().select('*')
      return sendSuccess(response, { message: 'Admin list', data: list })
    } catch (error) {
      return sendError(response, { message: error.message, code: 500 })
    }
  }
  async adminCreation({ request, response }: HttpContext) {
    try {
      const { fullname, email, password, role } = request.body()
      await request.validateUsing(createAdminRegistrationValidator)
      if (!/^super_admin|admin/.test(role))
        return sendError(response, { message: 'Invalid role selected' })

      await db.transaction(async (client) => {
        //Create account
        const admin = await Admin.create({ fullname, email, password, role }, { client })
        //Generate Email verification code
        /* const verificationOTP = await this.otpService.genRedisCode({
          user_id: admin.id,
          code_type: 'email_verification',
        })
        await this.emailService
          .setTemplate<VerificationEmail>('email_verification', {
            fullname,
            verification_url: `${env.get('WEBSITE_URL')}/verification?type=email-verification&email=${email}&token=${verificationOTP}`,
          })
          .sendMail({
            subject: 'Email Verification',
            to: email,
            from: 'Pake Estate Management',
          })*/
        return sendSuccess(response, {
          message: 'Account created successfully',
          data: { ...admin.$attributes, password: '****' },
        })
      })
    } catch (error) {
      let message: string = ''
      if ((error.message as string).includes('duplicate key value violates unique constraint')) {
        message = 'Email address already in use'
      } else {
        message = error.message
      }
      return sendError(response, { code: 500, error: error, message })
    }
  }
}
