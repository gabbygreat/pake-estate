import { test } from '@japa/runner'
import EmailService,{WelcomeEmail} from '#services/email_service'
// test.group('User send email', () => {
//   test('example test', async ({ assert }) => {
//   })
// })
test('send-email',async()=>{
  const emS = new EmailService()
  await emS.setTemplate<WelcomeEmail>('welcome_email',{firstname:'Success'}).sendMail({
    subject:'Welcome onboard!',
    from:'Pake Estate',
    to:'successonyegbanokwu@gmail.com'
  })
})