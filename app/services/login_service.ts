import User from "#models/user"
import axios from "axios"
// import type { Authenticator } from '@adonisjs/auth'
// import { Authenticators } from "@adonisjs/auth/types"


export default class LoginService {

    async googleLoginService(access_token: string) {
        interface GoogleUser {
          sub: string
          name: string
          given_name: string
          family_name: string
          picture: string
          email: string
          email_verified: boolean
          locale: string
        }
        const { data, status } = await axios.get(
          `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`
        )
        if (status !== 200) {
          return { error: true, message: 'Network error' }
        }
        const googleUser: GoogleUser = data
        if (googleUser.email_verified) {
          const user = await User.findBy('email', googleUser.email)
          if (user) {
            if(!user.firstname || !user.lastname){
              user.firstname = googleUser.given_name
              user.lastname = googleUser.family_name
              await user.save()
            }
            const token = await User.accessTokens.create(user,[],{expiresIn: '100 days'})//generate(user, { expiresIn: '100 days' })
            return {
              error: false,
              message: 'Login successful',
              data: {
                token: token,
                user: user,
              },
            }
          } else {
            const user = new User()
            user.register_source = 'gmail'
            user.password = ' '
            user.firstname = googleUser.given_name
            user.lastname = googleUser.family_name
            user.profile_picture = googleUser.picture
            //user.username = `${(googleUser.given_name as string).toLocaleLowerCase()}${googleUser.sub.slice(0, 4)}`
            user.email = googleUser.email
            await user.save()
            const token = await User.accessTokens.create(user,[],{expiresIn: '100 days'})
            return {
              error: false,
              message: 'Login successful',
              data: {
                token: token,
                user: user,
              },
            }
          }
        } else {
          return { error: true, message: 'invalid user' }
        }
      }
}