import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('uuid_generate_v4()').knexQuery)
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE')
      table.text('message').notNullable()
      table.string('title').notNullable()
      table.string('slug').nullable()
      table.boolean('read').defaultTo(false)
      table.string('destination_url').nullable()
      table.json('actor_refs').defaultTo([])
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}