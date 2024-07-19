import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'properties'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      //table.increments('id')
      table.uuid('id').primary().defaultTo(this.db.rawQuery('uuid_generate_v4()').knexQuery)
      table.uuid('owner_id').notNullable().references('id').inTable('users')
      table.enu('current_state', ['draft', 'published']).notNullable()
      table.string('flagged').nullable()
      table.number('total_reviews').defaultTo(0)
      table.number('total_rating').defaultTo(0)
      table.number('total_views').defaultTo(0)
      table.number('total_purchases').defaultTo(0)
      table.decimal('ask_price').notNullable()
      table.boolean('show_pricing').defaultTo(true)
      table.string('property_title').notNullable()
      table.string('property_type').notNullable()
      table.string('unit_number').nullable()
      table.number('general_capacity').nullable()
      table.string('landmarks').nullable()
      table.string('independent_spaces').nullable()
      table.string('house_number').nullable()
      table.string('street_name').nullable()
      table.string('city').notNullable()
      table.string('postal_code').nullable()
      table.string('state').notNullable()
      table.string('country').notNullable()
      table.decimal('longitude').nullable()
      table.decimal('latitude').nullable()
      table.boolean('available').defaultTo(true)
      table.string('pet_policy').nullable()
      table.string('maintainance_information').nullable()
      table.enu('furnishing', ['furnished', 'semi-furnished', 'fully-furnished']).notNullable()
      table.decimal('general_rent_fee').nullable()
      table.string('general_lease_time').nullable()
      table.string('general_renewal_cycle').nullable()
      table.number('security_deposit').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}