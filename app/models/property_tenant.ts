import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { RentalHistory } from '../types.js'
import TenantDocument from './tenant_document.js'
import type{ BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { hasMany } from '@adonisjs/lucid/orm'
import Property from './property.js'

export default class PropertyTenant extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare property_id: string

  @column()
  declare fullname: string

  @column()
  declare email: string

  @column()
  declare gender: 'male'|'female'

  @column()
  declare rental_history: RentalHistory

  @column()
  declare employed: boolean

  @column()
  declare employee_name: string

  @column()
  declare job_position: string

  @column()
  declare job_salary: string

  @column()
  declare company_name: string

  @column()
  declare pet_names: string[]

  @column()
  declare pet_types: string[]

  @column()
  declare total_pets: number

  @column()
  declare pet_breeds: string[]

  @column()
  declare lease_start_date: Date

  @column()
  declare lease_term: string

  @column()
  declare lease_payment: string

  @column()
  declare offering_price: number

  @column()
  declare status: 'in-progress'|'rejected'|'approved'

  @column()
  declare payment_date: Date

  @column()
  declare payment_currency: string

  @column()
  declare payment_next_due_date: Date

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(()=>TenantDocument,{foreignKey:'tenant_id', localKey:'id'})
  declare documents:HasMany<typeof TenantDocument>

  @belongsTo(()=>Property,{foreignKey:'property_id', localKey:'id'})
  declare propertyInfo:BelongsTo<typeof Property>
}