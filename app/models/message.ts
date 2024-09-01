import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare sender_id: string

  @column()
  declare receiver_id: string

  @column()
  declare read_status: boolean

  @column()
  declare text_content: string

  @column()
  declare files: {url:string,type:string}[] | string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}