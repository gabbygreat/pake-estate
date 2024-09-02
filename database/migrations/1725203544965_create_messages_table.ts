import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('uuid_generate_v4()').knexQuery)
      
      table.uuid('sender_id').references('id').inTable('users').onDelete('CASCADE')
    
      table.uuid('receiver_id').references('id').inTable('users').onDelete('CASCADE')
    
      table.boolean('read_status').defaultTo(false)
    
      table.text('text_content').nullable()
    
      table.json('files').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}