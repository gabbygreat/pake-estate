import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'rental_invoice_payments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('uuid_generate_v4()').knexQuery)
      table.uuid('invoice_id').references('id').inTable('rental_invoices').onDelete('CASCADE')
      table.decimal('amount_paid',20,3).defaultTo(0)
      table.timestamp('payment_date').nullable()
      table.string('payment_method').nullable()
      table.string('payment_channel').nullable()
      table.string('reference_number').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}