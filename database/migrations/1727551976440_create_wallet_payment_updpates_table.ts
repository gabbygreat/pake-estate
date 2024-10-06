import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wallet_payments'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('channel_payment_id').nullable()
      table.string('payment_status').defaultTo('pending')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumns('channel_payment_id','payment_status')
    })
  }
}