import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wallet_payments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.uuid('wallet_id').references('id').inTable('wallets').onDelete('CASCADE')
      table.decimal('amount_paid',20,3)
      table.text('description').nullable()
      table.uuid('currency_id').references('id').inTable('currencies').onDelete('CASCADE')
      table.string('transaction_type').nullable()
      table.text('payment_gateway').nullable()
      table.string('payment_reference').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}