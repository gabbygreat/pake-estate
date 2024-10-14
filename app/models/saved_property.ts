import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import User from './user.js'
import { hasOne } from '@adonisjs/lucid/orm'
import type { HasOne } from '@adonisjs/lucid/types/relations'
import Property from './property.js'

export default class SavedProperty extends BaseModel {
  public static table = 'create_save_properties'
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare user_id: string

  @column()
  declare property_id: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasOne(()=>User,{foreignKey:'id', localKey:'user_id'})
  declare owner:HasOne<typeof User>
  
  @hasOne(()=>Property,{foreignKey:'id', localKey:'property_id'})
  declare propertyInfo:HasOne<typeof Property>
}