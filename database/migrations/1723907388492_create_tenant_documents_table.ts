import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tenant_documents'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('uuid_generate_v4()').knexQuery)
      table.string('document_type').nullable()
      table.string('document_url').nullable()
      table.string('document_name').notNullable()
      table.string('document_category').notNullable()
      table.uuid('tenant_id').references('id').inTable('property_tenants').onDelete('CASCADE').notNullable()
      table.uuid('property_id').references('id').inTable('properties').onDelete('CASCADE').notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}