import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'maintenance_requests'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('uuid_generate_v4()').knexQuery)
      table.uuid('applicant_id').references('id').inTable('users').onDelete('CASCADE')
      table.uuid('property_id').references('id').inTable('properties').onDelete('CASCADE')
      table.uuid('owner_id').references('id').inTable('users').onDelete('CASCADE')
      table.enum('status',['rejected','ongoing','pending','done']).defaultTo('pending')
      table.string('request_title').nullable()
      table.text('description').nullable()
      table.json('images').defaultTo([])

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}