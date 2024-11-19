import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'property_tenants'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('auto_renewal').defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('auto_renewal')
    })
  }
}