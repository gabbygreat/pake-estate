import vine, { SimpleMessagesProvider } from '@vinejs/vine'

export const createLoginValidator = vine.compile(
    vine.object({
        email: vine.string().trim().email(),
        password: vine.string().trim().minLength(6),
    })
)

createLoginValidator.messagesProvider = new SimpleMessagesProvider({
    "email.email":"A valid email address is required",
    "password.minLength":"Password must be at least 6 characters long",
},
{email:"Email",password:"Password"})