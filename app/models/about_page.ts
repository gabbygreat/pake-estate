import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class AboutPage extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare background_image: string

  @column()
  declare header_text: string

  @column()
  declare properties: string

  @column()
  declare renters: string

  @column()
  declare who_are_we: string

  @column()
  declare aim: string

  @column()
  declare testimonials: string

  @column()
  declare what_we_do: string

  @column()
  declare managers: string

  @column()
  declare brokers: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}