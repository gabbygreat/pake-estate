import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { BelongsTo } from '@adonisjs/lucid/types/relations'
import { belongsTo } from '@adonisjs/lucid/orm'
import Property from './property.js'
export default class PropertyMedia extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare media_url: string

  @column()
  declare media_type: string

  @column()
  declare media_thumbnail_url:string

  @column()
  declare property:string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(()=>Property,{foreignKey:'id',localKey:'property'})
  declare attachedProperty:BelongsTo<typeof Property>
}