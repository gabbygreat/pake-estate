import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class TenantDocument extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare document_type: string

  @column()
  declare document_url: string

  @column()
  declare document_name: string

  @column()
  declare document_category: 'identity'|'bank_statement'

  @column()
  declare tenant_id: string

  @column()
  declare property_id: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}