import { DateTime } from 'luxon'
import { BaseModel, column,hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import RentalInvoicePayment from './rental_invoice_payment.js'
export default class RentalInvoice extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare tenant_id: string

  @column()
  declare property_id: string

  @column()
  declare payer_id: string

  @column()
  declare invoice_number: string

  @column()
  declare due_date: Date

  @column()
  declare total_amount: number

  @column()
  declare status:'unpaid'| 'paid'| 'overdue'

  @column()
  declare payment_date: Date

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(()=>RentalInvoicePayment,{foreignKey:'invoice_id', localKey:'id'})
  declare payments:HasMany<typeof RentalInvoicePayment>
}