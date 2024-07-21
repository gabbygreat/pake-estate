import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'property_legal_requirements'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      //table.increments('id')
      table.uuid('id').primary().defaultTo(this.db.rawQuery('uuid_generate_v4()').knexQuery)
      table.string('name').nullable()
      table.string('description').nullable()
      table.string('document_url').nullable()
      table.string('property').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}