import vine, { SimpleMessagesProvider } from '@vinejs/vine'

export const createTenantValidator = vine.compile(
    vine.object({
        property_id: vine.string().uuid(),
        fullname: vine.string(),
        email: vine.string().email(),
        dob: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
        mobile: vine.string().mobile(),
        gender: vine.enum(['male','female']),
        identity_documents_names: vine.array(vine.string()),
        bank_statement_names: vine.array(vine.string()),
         //rental_history: vine.string(),//vine.object({
        //     address: vine.string(),
        //     landlord_name: vine.string().nullable(),
        //     landlord_mobile: vine.string().nullable(),
        //     landlord_email: vine.string().nullable(),
        //     duration: vine.string().nullable(),
        // }).nullable(),
        employed: vine.boolean()
    })
)

createTenantValidator.messagesProvider = new SimpleMessagesProvider({
    'required': 'The {{ field }} field is required',
    'string': 'The value of {{ field }} field must be a string',
    'email': 'Please provide a valid email address',
    "property_id.uuid": "The Property ID is not a valid property UUID",
    "fullname.required": "Full Name is required",
    "gender.enum":"Invalid gender selection",
    "identity_documents_names":"Identity documents are required",
    "bank_statement_names":"Bank statement is required"
},{landlord_email:'Landlord Email',dob:'Date of Birth'})