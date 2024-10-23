/* eslint-disable @typescript-eslint/no-explicit-any */
import Property from '#models/property'
import PropertyTenant from '#models/property_tenant'
import RentalInvoice from '#models/rental_invoice'
import { cuid } from '@adonisjs/core/helpers'

export default class RentalInvoiceService {
  async generateInvoice(tenant_id: string) {
    const {fees, property_id, applicant_id} = await this.invoiceFees(tenant_id)
    let totalAmount = 0
    fees.forEach((e)=>{
        totalAmount += e.amount - ((e.discount/100) * e.amount)
    })
    const property = await Property.query()
    .select(['general_renewal_cycle','currency_id']).where('id','=',property_id)
    const today = new Date()
    const dueDate = new Date(today.getTime() + 1000 * (3600 * 24 * 7)) //7 DAYS
    const nextPaymentDate = property[0].general_renewal_cycle == 'daily' ?
                            new Date(today.getTime() + 1000 * (3600 * 24 * 1)) :
                            property[0].general_renewal_cycle == 'hourly' ?
                            new Date(today.getTime() + 1000 * (3600 * 1)) :
                            property[0].general_renewal_cycle == 'monthly' ?
                            new Date(today.getTime() + 1000 * (3600 * 24 * 30)) : //30 DAYS
                            property[0].general_renewal_cycle == 'weekly' ?
                            new Date(today.getTime() + 1000 * (3600 * 24 * 7)) :
                            property[0].general_renewal_cycle == 'yearly' ?
                            new Date(today.getTime() + 1000 * (3600 * 24 * 365)) :
                            null
    await RentalInvoice.create({
        payer_id:applicant_id,
        tenant_id,
        property_id,
        currency_id: property[0].currency_id!,
        total_amount: totalAmount,
        due_date: dueDate,
        next_payment_date: nextPaymentDate as any,
        invoice_number: `inv-${cuid()}`
    })

    await PropertyTenant.query().where('id','=',tenant_id).update('payment_next_due_date',nextPaymentDate)
  
  }


  async invoiceFees(tenant_id: string) {
    const mainFee = await PropertyTenant.query()
      .select(['id', 'offering_price','property_id','applicant_id', 'discount_price'])
      .where('id', '=', tenant_id)
      .preload('applicableFees', (fees) => {
        fees.select(['id', 'fee_discount', 'fee_id', 'property_id']).preload('feeInfo', (info) => {
          info.select(['amount', 'name'])
        })
      })
    const fees: Array<{
      slug: string
      name: string
      amount: number
      discount: number
      id: string | null
    }> = []
    fees[0] = {
      slug: 'RENTAL_FEE',
      name: 'rent fee',
      amount: mainFee[0].offering_price,
      discount: mainFee[0].discount_price,
      id: null,
    }
    mainFee[0].applicableFees.forEach((e) => {
      fees.push({
        slug: 'OTHERS',
        name: e.feeInfo.name,
        amount: e.feeInfo.amount,
        discount: e.fee_discount,
        id: e.id,
      })
    })

    return {fees, property_id:mainFee[0].property_id,applicant_id:mainFee[0].applicant_id}
  }
}
