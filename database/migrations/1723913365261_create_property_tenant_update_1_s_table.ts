import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'property_tenants'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.uuid('property_id').references('id').inTable('properties').onDelete('CASCADE')
      table.string('fullname').nullable()
      table.string('email').nullable()
      table.string('gender').nullable()
      table.string('mobile').nullable()
      table.string('dob').nullable()
      table.json('rental_history').nullable()
      table.boolean('employed').defaultTo(false)
      table.string('employee_name').nullable()
      table.string('employment_type').nullable()
      table.string('job_position').nullable()
      table.string('job_salary').nullable()
      table.string('company_name').nullable()
      table.json('pet_names').nullable()
      table.timestamp('approval_date').nullable()
      table.json('pet_types').nullable()
      table.integer('total_pets').nullable()
      table.json('pet_breeds').nullable()
      table.timestamp('lease_start_date').nullable()
      table.string('lease_term')
      table.string('lease_payment')
      table.decimal('offering_price').defaultTo(0)
      table.decimal('discount_price').defaultTo(0)
      table.string('status').nullable()
      table.timestamp('payment_date').nullable()
      table.uuid('payment_currency').references('id').inTable('client_currencies').onDelete('CASCADE')
      table.timestamp('payment_next_due_date').nullable()
      table.string('payment_status').defaultTo('unpaid')
      table.uuid('applicant_id').references('id').inTable('users').onDelete('CASCADE')
      table.uuid('property_owner_id').references('id').inTable('users').onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName,(table)=>{
      table.dropColumns('property_id','fullname','email','lease_term','dob','mobile','approval_date',
        'gender','rental_history','employed','employee_name','lease_payment','employment_type',
        'job_position','job_salary','company_name','pet_names','offering_price','applicant_id',
        'pet_types','total_pets','pet_breeds','lease_start_date','discount_price','property_owner_id',
        'status','payment_date','payment_currency','payment_next_due_date','payment_status',
      )
    })
  }
}