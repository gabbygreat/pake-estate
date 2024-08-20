import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import PropertyFee from './property_fee.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import PropertyTenant from './property_tenant.js'
import Property from './property.js'

export default class TenantApplicableFee extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare property_id: string

  @column()
  declare tenant_id: string

  @column()
  declare fee_id: string

  @column()
  declare fee_discount: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(()=>PropertyFee,{foreignKey:'fee_id', localKey:'id'})
  declare feeInfo: BelongsTo<typeof PropertyFee>

  @belongsTo(()=>PropertyTenant,{foreignKey:'property_tenant', localKey:'id'})
  declare tenantInfo: BelongsTo<typeof PropertyTenant>

  @belongsTo(()=>Property,{foreignKey:'property_id', localKey:'id'})
  declare propertyInfo: BelongsTo<typeof Property>
}