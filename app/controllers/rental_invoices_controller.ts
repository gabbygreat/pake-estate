/* eslint-disable @typescript-eslint/ban-ts-comment */
import RentalInvoice from '#models/rental_invoice'
import type { HttpContext } from '@adonisjs/core/http'
import { sendError, sendSuccess } from '../utils.js'
import RentalInvoiceService from '#services/rentalinvoice_service'
import NotificationService from '#services/notification_service'
import db from '@adonisjs/lucid/services/db'
import Wallet from '#models/wallet'
import { inject } from '@adonisjs/core'
import Notification from '#models/notification'
import Property from '#models/property'
import WalletService from '#services/wallet_service'

@inject()
export default class RentalInvoicesController {

    constructor(
        protected rentalInvoiceService: RentalInvoiceService,
        protected notificationService: NotificationService,
        protected walletService: WalletService
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
            .select('*')
            .where('payer_id','=',user.id)
            .preload('property',(property)=>{
                property.select(['general_renewal_cycle','property_title'])
            })
            .preload('currency',(currency)=>{
                currency.select(['name','symbol','id','code','decimal_digits','symbol_native'])
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
            const invoice = await RentalInvoice
            .query()
            .select('*').where('id','=',id)
            .preload('currency',(currency)=>{
                currency.select(['name','symbol','id','code','decimal_digits','symbol_native'])
            })
            const { fees } = await this.rentalInvoiceService.invoiceFees(invoice[0].tenant_id)
            return sendSuccess(response,{
                message:"Invoice Information",
                data:{
                    fees,
                    invoice:invoice[0]
                }
            })
        } catch {
            return sendError(response,{message:"Rental Invoices", code: 500})   
        }
    }

    async processPayment({ request,auth,response}:HttpContext){
        try {
            const { id } = request.params()
            const user = auth.use('api').user!
            await db.transaction(async(client)=>{
                const invoice = await RentalInvoice.find(id,{client})
                if(invoice && user){
                    if(invoice.status == 'paid'){
                        return sendError(response,{message:"Invoice already paid for", code:403})
                    }
                    const balance = await Wallet.query({client}).select('*')
                    .where((q)=>q.whereRaw(`user_id = ? AND currency_id = ?`,[
                        user.id,
                        invoice.currency_id
                    ]))
                    if(Number(balance[0].balance) >= Number(invoice.total_amount)){
                        balance[0].balance = balance[0].balance - invoice.total_amount
                        invoice.status = 'paid'
                        invoice.payment_date = new Date()
                        await invoice.useTransaction(client).save()
                        await balance[0].useTransaction(client).save()

                        //Property information
                        const property = await Property.query().select(['property_title','owner_id']).where('id','=',invoice.property_id)
                        //Credit Landlord
                        await this.walletService.creditWallet({
                            user_id:property[0].owner_id,
                            description:`Rental Payment for ${property[0].property_title} by ${user?.firstname} ${user?.lastname}`,
                            amount:invoice.total_amount,
                            currency:invoice.currency_id,
                            client
                        })
                        //NOTIFY LANDLORD
                        const notificationTemplate = this.notificationService
                        .message()['RENTAL_PAYMENT_NOTIFICATION_FOR_LANDLORD'](
                            {
                                property_name: 
                                property[0].property_title, 
                                tenant_name:`${user?.firstname} ${user?.lastname}`,
                                date:new Date().toUTCString()
                            })
                        await Notification.create(
                        {
                            user_id: property[0].owner_id,
                            title: notificationTemplate.title,
                            message: notificationTemplate.message,
                            type: notificationTemplate.type,
                            actor_refs: JSON.stringify([user.id]),
                            entity_ids: JSON.stringify({ property_id: invoice.property_id }),
                            slug: 'RENTAL_PAYMENT_NOTIFICATION_FOR_LANDLORD',
                        },
                        { client }
                        )
                        //NOTIFY TENANT
                        const notificationTemplate_1 = this.notificationService
                        .message()['RENTAL_PAYMENT_NOTIFICATION_FOR_TENANT'](
                            {
                                property_name: 
                                property[0].property_title, 
                                date:new Date().toUTCString()
                            })
                        await Notification.create(
                        {
                            user_id: user.id,
                            title: notificationTemplate_1.title,
                            message: notificationTemplate_1.message,
                            type: notificationTemplate_1.type,
                            actor_refs: JSON.stringify([user.id]),
                            entity_ids: JSON.stringify({ property_id: invoice.property_id }),
                            slug: 'RENTAL_PAYMENT_NOTIFICATION_FOR_TENANT',
                        },
                        { client }
                        )
                        return sendSuccess(response,{message:"Payment successful"})
                    }else{
                        return sendError(response,{message:"Insufficient balance",code:400}) 
                    }
                }else{
                    return sendError(response,{message:"Invoice not found",code:400})
                }
            })
        } catch {
            return sendError(response,{message:"Rental Invoices", code: 500}) 
        }
    }
}