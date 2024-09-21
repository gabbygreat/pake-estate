import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { belongsTo } from '@adonisjs/lucid/orm'
import User from './user.js'
import Currency from './currency.js'
export default class Wallet extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare currency_id: string

  @column()
  declare user_id: string

  @column()
  declare balance: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(()=>User,{foreignKey:'user_id', localKey:'id'})
  declare user:BelongsTo<typeof User>

  @belongsTo(()=>Currency,{foreignKey:'currency_id', localKey:'id'})
  declare currency:BelongsTo<typeof Currency>
}