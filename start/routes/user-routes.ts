import router from "@adonisjs/core/services/router";
import UsersController from "#controllers/users_controller";
import { middleware } from '#start/kernel'

router.group(()=>{

    router.post('register',[UsersController,'register'])

    router.post('register-other-source',[UsersController,'registerOtherSource'])

    router.post('login',[UsersController,'login'])

    router.post('login-other-source',[UsersController,'loginOtherSource'])

    router.get('logout',[UsersController,'logout']).use(middleware.auth({ guards: ['api']}))

    router.get('forgot-password/:email',[UsersController,'forgotPasswordRequest'])

    router.post('reset-password',[UsersController,'resetPassword'])

    router.post('verify-email',[UsersController,'verifyEmail'])

    router.get('resend-verification-token/:email',[UsersController,'resendEmailVerificationCode'])

    router.get('notifications',[UsersController,'notifications']).use(middleware.auth({guards:['api']}))

}).prefix('/user')