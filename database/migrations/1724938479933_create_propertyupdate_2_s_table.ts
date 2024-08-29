import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'properties'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('bedrooms').defaultTo(0)
      table.integer('bathrooms').defaultTo(0)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table)=>{
      table.dropColumns('bedrooms','bathrooms')
    })
  }
}