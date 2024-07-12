import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    await this.db.rawQuery('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";').knexQuery
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('uuid_generate_v4()').knexQuery)
      table.string('firstname').nullable()
      table.string('lastname').nullable()
      table.string('phone_number').nullable()
      table.string('register_source').defaultTo('standard')//standard|gmail
      table.string('house_number').nullable()
      table.string('street_name').nullable()
      table.string('city').nullable()
      table.string('postal_code').nullable()
      table.boolean('email_verified').defaultTo(false)
      table.timestamp('email_verified_at').nullable()
      table.json('country').nullable().defaultTo({country_name:'',country_code:''})//{country_name:string,country_code:string}
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
      table.string('profile_picture').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}