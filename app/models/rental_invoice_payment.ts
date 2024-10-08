import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class RentalInvoicePayment extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare invoice_id: string

  @column()
  declare amount_paid:number

  @column()
  declare payment_date: Date

  @column()
  declare payment_method:'credit_card'| 'bank_transfer'| 'cash'

  @column()
  declare payment_channel: 'stripe'|'paypal'|'pakewallet'

  @column()
  declare reference_number: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}