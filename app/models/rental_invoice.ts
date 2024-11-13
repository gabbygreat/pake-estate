import { DateTime } from 'luxon'
import { BaseModel, column,hasMany,hasOne } from '@adonisjs/lucid/orm'
import type { HasMany , HasOne} from '@adonisjs/lucid/types/relations'
import RentalInvoicePayment from './rental_invoice_payment.js'
import Property from './property.js'
import Currency from './currency.js'
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

  @column()
  declare next_payment_date: Date

  @column()
  declare currency_id: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(()=>RentalInvoicePayment,{foreignKey:'id', localKey:'invoice_id'})
  declare payments:HasMany<typeof RentalInvoicePayment>

  @hasOne(()=>Property,{foreignKey:'id', localKey:'property_id'})
  declare property:HasOne<typeof Property>

  @hasOne(()=>Currency,{foreignKey:'id', localKey:'currency_id'})
  declare currency:HasOne<typeof Currency>
}