import mail from "@adonisjs/mail/services/main"
import env from "#start/env"
type EmailTemplate = 'welcome_email'|'forgot_password'|'email_verification'
export interface WelcomeEmail {
    firstname: string
}
export default class EmailService {

    private template: EmailTemplate = "email_verification"
    private data: any

    setTemplate<T>(tmpl:EmailTemplate,data:T){
        this.template = tmpl
        this.data = data
        return this
    }

    async sendMail({subject,from,to}:{subject:string,from:string,to:string}){
        await mail.send((mailer)=>{
            mailer
            .from(env.get('SMTP_USERNAME'),from)
            .to(to)
            .subject(subject)
            .htmlView(`email/${this.template}`,this.data)
        })
    }

}