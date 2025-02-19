import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'home_pages'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .uuid('admin_id')
        .notNullable()
        .references('id')
        .inTable('admins')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
      table.renameColumn('background_Image', 'background_image')
      table.renameColumn('banner_Image', 'banner_image')
      table.renameColumn('who_Are_We', 'who_are_we')
      table.renameColumn('why_Choose_Us', 'why_choose_us')
      table.renameColumn('header_Text', 'header_text')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('admin_id')
      table.renameColumn('background_image', 'background_Image')
      table.renameColumn('banner_image', 'banner_Image')
      table.renameColumn('who_Are_We', 'who_are_we')
      table.renameColumn('why_choose_us', 'why_Choose_Us')
      table.renameColumn('header_text', 'header_Text')
    })
  }
}
