import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'properties'

  async up() {
    await this.db.rawQuery('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";').knexQuery
    this.schema.createTable(this.tableName, (table) => {
      //table.increments('id')
      table.uuid('id').primary().defaultTo(this.db.rawQuery('uuid_generate_v4()').knexQuery)
      table.uuid('owner_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.enu('current_state', ['draft', 'published']).notNullable()
      table.string('flagged').nullable()
      table.integer('total_reviews').defaultTo(0)
      table.decimal('total_rating',8,2).defaultTo(0)
      table.integer('total_views').defaultTo(0)
      table.integer('total_purchases').defaultTo(0)
      table.decimal('ask_price').defaultTo(0)
      table.boolean('show_pricing').defaultTo(true)
      table.string('property_title').nullable()
      table.text('property_description').nullable()
      table.string('property_type').nullable()
      table.string('unit_number').nullable()
      table.integer('general_capacity').nullable()
      table.string('landmarks').nullable()
      table.string('independent_spaces').nullable()
      table.string('house_number').nullable()
      table.string('street_name').nullable()
      table.string('city').nullable()
      table.string('postal_code').nullable()
      table.string('state').nullable()
      table.string('country').nullable()
      table.decimal('longitude').nullable()
      table.decimal('latitude').nullable()
      table.boolean('available').defaultTo(true)
      table.string('pet_policy').nullable()
      table.string('maintainance_information').nullable()
      table.enu('furnishing', ['furnished', 'semi-furnished', 'fully-furnished']).nullable()
      table.decimal('general_rent_fee').nullable()
      table.string('general_lease_time').nullable()
      table.string('general_renewal_cycle').nullable()
      table.decimal('security_deposit').nullable()
      table.json('owner_contact_details').defaultTo(JSON.stringify([]))
      table.json('manager_contact_details').defaultTo(JSON.stringify([]))
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}