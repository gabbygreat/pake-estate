import RentalInvoice from '#models/rental_invoice'
import type { HttpContext } from '@adonisjs/core/http'
import { sendError, sendSuccess } from '../utils.js'
import RentalInvoiceService from '#services/rentalinvoice_service'
// import db from '@adonisjs/lucid/services/db'
import { inject } from '@adonisjs/core'

@inject()
export default class RentalInvoicesController {

    constructor(
        protected rentalInvoiceService: RentalInvoiceService
    ){

    }
    /**
     * 
     * @param param0 ALL INVOICES
     * @returns 
     */
    async allInvoices({ request,auth, response}:HttpContext){
        try {
            interface Filter{
                search?: string,
                propertyId?: string,
                status?:'unpaid'|'paid'|'overdue',
                page?: number
                perPage?:number
            }
            const input:Filter = request.qs()
            const user = auth.use('api').user!

            const invoicesQuery = RentalInvoice.query()
            .select([])
            .where('payer_id','=',user.id)
            .preload('property',(property)=>{
                property.select(['general_renewal_cycle'])
            })
            if(input.search && input.search != undefined && input.search != 'undefined'){
                invoicesQuery.join('properties','rental_invoices.property_id','=','properties.id')
                .where((q)=>q.whereRaw(`property_title % ?`,[input.search!]))
            }
            if(input.propertyId && input.propertyId != undefined && input.propertyId != 'undefined'){
                invoicesQuery.andWhere('rental_invoices.property_id','=',input.propertyId)
            }
            if(input.status){
                invoicesQuery.andWhere('rental_invoices.status','=',input.status)
            }
            const invoices = await invoicesQuery.orderBy('created_at','desc').paginate(input.page || 1, input.perPage || 20)
            return sendSuccess(response,{
                message:"Rental Invoices",
                data: invoices
            })
        } catch {
            return sendError(response,{message:"Rental Invoices", code: 500})
        }
    }

    async invoiceInformation({ request,response }:HttpContext){
        try {
            const { id } = request.params()
            const invoice = await RentalInvoice.query().select('*').where('id','=',id)
            const { fees } = await this.rentalInvoiceService.invoiceFees(invoice[0].tenant_id)
            return sendSuccess(response,{
                message:"Invoice Information",
                data:{
                    fees,
                    invoice
                }
            })
        } catch {
            return sendError(response,{message:"Rental Invoices", code: 500})   
        }
    }

    // async processPayment({ request,auth,response}:HttpContext){
    //     try {
    //         const { id } = request.params()
    //         const user = auth.use('api').user!
    //         await db.transaction(async(client)=>{
    //             const invoice = await RentalInvoice.find(id,{client})
    //             //Check wallet balance
    //             const balance = 
    //         })
    //     } catch (error) {
    //         return sendError(response,{message:"Rental Invoices", code: 500}) 
    //     }
    // }
}