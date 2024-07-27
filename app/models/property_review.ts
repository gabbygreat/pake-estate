import { DateTime } from 'luxon'
import { BaseModel, column, hasOne } from '@adonisjs/lucid/orm'
import type { HasOne } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class PropertyReview extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare rating: number

  @column()
  declare property: string

  @column()
  declare review: string

  @column()
  declare user_id: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasOne(()=>User,{foreignKey:'id', localKey:'user_id'})
  declare userData:HasOne<typeof User>
}