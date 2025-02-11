import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class HomePage extends BaseModel {
  @column({ isPrimary: true })
  declare id: number
  
  @column()
  declare background_Image: string
  
  @column()
  declare banner_Image: string

  @column()
  declare header_Text: string

  @column()
  declare who_Are_We: string

  @column()
  declare why_Choose_Us: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
 
 
}