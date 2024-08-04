import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Currency extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare symbol: string

  @column()
	declare symbol_native: string

  @column()
	declare decimal_digits: string

  @column()
	declare rounding: string

  @column()
	declare code: string

  @column()
	declare name_plural: string

  @column()
  declare supported:boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}