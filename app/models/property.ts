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

  @column()
  declare ask_price: number

  @column()
  declare show_pricing: number

  @column()
  declare property_title: string

  @column()
  declare property_type: string

  @column()
  declare unit_number: string

  @column()
  declare general_capacity: number

  @column()
  declare landmarks: string

  @column()
  declare independent_spaces: string

  @column()
  declare house_number: string

  @column()
  declare street_name: string

  @column()
  declare city: string

  @column()
  declare postal_code: string

  @column()
  declare state: string

  @column()
  declare country: string


  @column()
  declare longitude: string


  @column()
  declare latitude: string

  @column()
  declare available: boolean

  @column()
  declare pet_policy: string

  @column()
  declare maintainance_information: string

  @column()
  declare furnishing: 'furnished'|'semi-furnished'|'fully-furnished'

  @column()
  declare general_rent_fee: number

  @column()
  declare general_lease_time: string

  @column()
  declare general_renewal_cycle: string

  @column()
  declare security_deposit: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasOne(()=>User,{foreignKey:'id', localKey:'owner_id'})
  declare owner:HasOne<typeof User>
}