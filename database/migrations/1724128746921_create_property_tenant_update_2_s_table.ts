import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'property_tenants'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('rejection_reason').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName,(table)=>{
      table.dropColumns('rejection_reason')
    })
  }
}