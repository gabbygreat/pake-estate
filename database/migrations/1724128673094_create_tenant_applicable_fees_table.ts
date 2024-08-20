import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tenant_applicable_fees'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('uuid_generate_v4()').knexQuery)
      table.uuid('property_id').references('id').inTable('properties').onDelete('CASCADE')
      table.uuid('tenant_id').references('id').inTable('property_tenants').onDelete('CASCADE')
      table.uuid('fee_id').references('id').inTable('property_fees').onDelete('CASCADE')
      table.decimal('fee_discount',8,3).defaultTo(0)

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}