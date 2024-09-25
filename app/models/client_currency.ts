import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { HasOne } from '@adonisjs/lucid/types/relations'
import { hasOne } from '@adonisjs/lucid/orm'
import Currency from './currency.js'
//Currency supported by the user
export default class ClientCurrency extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare currency_id: string

  @column()
  declare user_id: string

  @column()
  declare default_currency: boolean

  @column()
  declare supported:boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasOne(()=>Currency,{foreignKey:'id', localKey:'currency_id'})
  declare currency:HasOne<typeof Currency>
}