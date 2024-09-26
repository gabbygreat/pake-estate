import { DateTime } from 'luxon'
import { BaseModel, column, hasOne } from '@adonisjs/lucid/orm'
import Property from './property.js'
import type { HasOne } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class MaintenanceRequest extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare applicant_id: string

  @column()
  declare property_id: string

  @column()
  declare owner_id: string

  @column()
  declare status: 'rejected'|'ongoing'|'pending'|'done'

  @column()
  declare request_title: string

  @column()
  declare description: string

  @column()
  declare images: string[]

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasOne(()=>Property,{foreignKey:'id', localKey:'property_id'})
  declare propertyInfo:HasOne<typeof Property>

  @hasOne(()=>User,{foreignKey:'id', localKey:'owner_id'})
  declare ownerInfo:HasOne<typeof User>

  @hasOne(()=>User,{foreignKey:'id', localKey:'applicant_id'})
  declare applicantInfo:HasOne<typeof User>
}