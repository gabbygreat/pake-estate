import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import PropertyTenant from './property_tenant.js'
import type{ BelongsTo } from '@adonisjs/lucid/types/relations'

export default class TenantPaymentHistory extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare tenant_id: string

  @column()
  declare amount_due: number

  @column()
  declare amount_paid: number

  @column()
  declare property_id: string

  @column()
  declare payment_reference: string

  @column()
  declare tax_amount: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(()=>PropertyTenant,{foreignKey:'tenant_id', localKey:'id'})
  declare tenantInfo:BelongsTo<typeof PropertyTenant>
}