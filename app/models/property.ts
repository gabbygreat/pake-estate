import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { HasOne } from '@adonisjs/lucid/types/relations'
import { hasOne } from '@adonisjs/lucid/orm'
import User from './user.js'
export default class Property extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare owner_id: string

  @column()
  declare current_state: 'draft'|'published'

  @column()
  declare flagged: string

  @column()
  declare total_reviews: number

  @column()
  declare total_rating: number

  @column()
  declare total_views: number

  @column()
  declare total_purchases: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasOne(()=>User,{foreignKey:'id', localKey:'owner_id'})
  declare owner:HasOne<typeof User>
}