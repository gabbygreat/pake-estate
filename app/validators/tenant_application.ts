import vine, { SimpleMessagesProvider } from '@vinejs/vine'

export const createTenantalidator = vine.compile(
    vine.object({
        property_id: vine.string().uuid(),
        fullname: vine.string(),
        email: vine.string().email(),
        dob: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        mobile: vine.string().mobile(),
        gender: vine.enum(['male','female']),
        rental_history: vine.object({
            address: vine.string(),
            landlord_name: vine.string(),
            landlord_mobile: vine.string(),
            landlord_email: vine.string(),
            duration: vine.string(),
        }).nullable(),
        employed: vine.boolean({strict:true})
    })
)

createTenantalidator.messagesProvider = new SimpleMessagesProvider({
    'required': 'The {{ field }} field is required',
    'string': 'The value of {{ field }} field must be a string',
    'email': 'Please provide a valid email address',
    "property_id.uuid": "The Property ID is not a valid property UUID"
})