import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'currencies'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      //table.increments('id')
      table.uuid('id').primary().defaultTo(this.db.rawQuery('uuid_generate_v4()').knexQuery)
      table.string('name').nullable()
      table.string('symbol').nullable()
      table.string('symbol_native').nullable()
      table.string('decimal_digits').nullable()
      table.string('rounding').nullable()
      table.string('code').nullable()
      table.string('name_plural').nullable()
      table.boolean('supported').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}