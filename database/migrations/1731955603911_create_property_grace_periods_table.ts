import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'properties'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.bigInteger('payment_grace_period').defaultTo(3600 * 24 * 3)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table)=>{
      table.dropColumn('payment_grace_period')
    })
  }
}