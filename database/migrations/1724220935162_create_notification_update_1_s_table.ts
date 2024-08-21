import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('type').nullable()
      table.json('entity_ids').nullable()
      table.json('variable_list').defaultTo([])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName,(table)=>{
      table.dropColumns('type','entity_ids','variable_list')
    })
  }
}