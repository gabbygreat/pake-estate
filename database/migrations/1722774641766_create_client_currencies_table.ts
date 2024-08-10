import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'client_currencies'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      //table.increments('id')
      table.uuid('id').primary().defaultTo(this.db.rawQuery('uuid_generate_v4()').knexQuery)
      table.string('currency_id').nullable()
      table.string('user_id').nullable()
      table.string('default_currency').nullable()
      table.boolean('supported').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}