import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'about_pages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('uuid_generate_v4()').knexQuery)
      table.string('background_image').nullable()
      table.string('properties').nullable()
      table.string('renters').nullable()
      table.string('managers').nullable()
      table.string('brokers').nullable()
      table.string('aim').nullable()
      table.string('testimonials').nullable()
      table.string('header_text').nullable()
      table.string('who_we_do').nullable()
      table.string('why_Choose_Us').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}