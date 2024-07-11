import vine, { SimpleMessagesProvider } from '@vinejs/vine'

export const createEmailVerificationValidator = vine.compile(
    vine.object({
        email: vine.string().trim().email(),
        verification_code: vine.string(),
    })
)

createEmailVerificationValidator.messagesProvider = new SimpleMessagesProvider({
    "email.email":"A valid email address is required",
    "email.required":"Email address is required",
    "verification_code.required":"Invalid verification code",
},
{email:"Email",verification_code:"VerificationCode"})