import vine, { SimpleMessagesProvider } from '@vinejs/vine'

export const savePropertyValidator = vine.compile(
    vine.object({
        property_id: vine.number(),
        
    })
)
savePropertyValidator.messagesProvider = new SimpleMessagesProvider({
    'required': 'The {{ field }} field is required',
    'string': 'The value of {{ field }} field must be a string',
    'number': 'The value of {{ field}} field must be a number',
})


