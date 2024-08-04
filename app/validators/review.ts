import vine, { SimpleMessagesProvider } from '@vinejs/vine'

export const createReviewValidator = vine.compile(
    vine.object({
        review: vine.string().maxLength(600),
        rating: vine.number().max(5),
        property_id: vine.string().uuid()
    })
)

createReviewValidator.messagesProvider = new SimpleMessagesProvider({
    'required': 'The {{ field }} field is required',
    'string': 'The value of {{ field }} field must be a string',
    'email': 'The value is not a valid email address',
    "uuid": "The value is not a valid property ID"
})