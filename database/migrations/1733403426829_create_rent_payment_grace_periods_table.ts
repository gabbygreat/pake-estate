import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'property_tenants'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('rent_payment_grace_period').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table)=>{
      table.dropColumn('rent_payment_grace_period')
    })
  }
}