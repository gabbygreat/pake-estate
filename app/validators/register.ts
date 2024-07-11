import vine, { SimpleMessagesProvider } from '@vinejs/vine'

export const createRegistrationValidator = vine.compile(
    vine.object({
        firstname: vine.string(),
        lastname: vine.string(),
        email: vine.string().trim().email(),
        password: vine.string().trim().minLength(6),
        phone_number: vine.string().mobile(),
    })
)

createRegistrationValidator.messagesProvider = new SimpleMessagesProvider({
    "firstname.required":"Please enter your firstname",
    "email.email":"A valid email address is required",
    "password.minLength":"Password must be at least 6 characters long",
    "phone_number.required":"A valid mobile number is required"
},
{firstname:"FirstName",email:"Email",password:"Password",lastname:"LastName",phone_number:'MobileNumber'})