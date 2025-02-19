import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class HomePage extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare background_image: string

  @column()
  declare banner_image: string

  @column()
  declare header_text: string

  @column()
  declare who_are_we: string

  @column()
  declare why_choose_us: string

  @column()
  declare admin_id: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
