import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tenant_payment_histories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('uuid_generate_v4()').knexQuery)
      table.uuid('tenant_id').references('id').inTable('property_tenants').onDelete('CASCADE')
      table.decimal('amount_due')
      table.decimal('amount_paid',10,3)
      table.uuid('property_id').references('id').inTable('properties').onDelete('CASCADE')
      table.string('payment_reference').nullable()
      table.decimal('tax_amount').defaultTo(0)
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}