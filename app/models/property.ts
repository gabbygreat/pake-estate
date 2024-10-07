import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { HasOne } from '@adonisjs/lucid/types/relations'
import { hasOne } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { hasMany } from '@adonisjs/lucid/orm'
import User from './user.js'
import PropertyAmenity from './property_amenity.js'
import PropertyDocument from './property_document.js'
import PropertyFee from './property_fee.js'
import PropertyLegalRequirement from './property_legal_requirement.js'
import PropertyMedia from './property_media.js'
import PropertySection from './property_section.js'
import PropertyTenant from './property_tenant.js'
import PropertyUtility from './property_utility.js'
import PropertyReview from './property_review.js'
import Currency from './currency.js'
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
  declare hidden: boolean

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
  declare property_type: 'Apartment'|'Event Center'|'Store'

  @column()
  declare property_description: string

  @column()
  declare unit_number: string

  @column()
  declare general_capacity: number

  @column()
  declare landmarks: string

  @column()
  declare independent_spaces: string

  @column()
  declare bedrooms: number

  @column()
  declare bathrooms: number

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
  declare furnishing: 'un-furnished'|'furnished'|'semi-furnished'|'fully-furnished'

  @column()
  declare general_rent_fee: number

  @column()
  declare general_lease_time: string

  @column()
  declare general_renewal_cycle: 'yearly'|'monthly'|'daily'|'weekly'|'hourly'

  @column()
  declare security_deposit: number


  @column()
  declare owner_contact_details: string

  @column()
  declare listing_type:'sale'|'rent'

  @column()
  declare manager_contact_details: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasOne(()=>User,{foreignKey:'id', localKey:'owner_id'})
  declare owner:HasOne<typeof User>

  @hasMany(()=>PropertyAmenity,{foreignKey:'property', localKey:'id'})
  declare amenities:HasMany<typeof PropertyAmenity>

  @hasMany(()=>PropertyDocument,{foreignKey:'property', localKey:'id'})
  declare documents:HasMany<typeof PropertyDocument>

  @hasMany(()=>PropertyFee,{foreignKey:'property', localKey:'id'})
  declare fees:HasMany<typeof PropertyFee>

  @hasMany(()=>PropertyLegalRequirement,{foreignKey:'property', localKey:'id'})
  declare legalRequirements:HasMany<typeof PropertyLegalRequirement>

  @hasMany(()=>PropertyMedia,{foreignKey:'property', localKey:'id'})
  declare mediaItems:HasMany<typeof PropertyMedia>

  @hasMany(()=>PropertySection,{foreignKey:'property', localKey:'id'})
  declare sections:HasMany<typeof PropertySection>

  @hasMany(()=>PropertyTenant,{foreignKey:'property', localKey:'id'})
  declare tenants:HasMany<typeof PropertyTenant>

  @hasMany(()=>PropertyUtility,{foreignKey:'property', localKey:'id'})
  declare utilities:HasMany<typeof PropertyUtility>

  @hasMany(()=>PropertyReview,{foreignKey:'property', localKey:'id'})
  declare reviews:HasMany<typeof PropertyReview>

  @hasOne(()=>Currency,{foreignKey:'id', localKey:'currency_id'})
  declare currency:HasOne<typeof Currency>
}