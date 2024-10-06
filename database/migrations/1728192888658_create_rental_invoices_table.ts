import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'rental_invoices'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('uuid_generate_v4()').knexQuery)
      table.uuid('tenant_id').references('id').inTable('property_tenants').onDelete('CASCADE')
      table.uuid('property_id').references('id').inTable('properties').onDelete('CASCADE')
      table.uuid('payer_id').references('id').inTable('users').onDelete('CASCADE')
      table.string('invoice_number')
      table.timestamp('due_date')
      table.decimal('total_amount',20,3).defaultTo(0)
      table.enum('status',['unpaid', 'paid', 'overdue']).defaultTo('unpaid')
      table.timestamp('payment_date').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}