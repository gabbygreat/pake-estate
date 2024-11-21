/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import type { HttpContext } from '@adonisjs/core/http'
import { sendError, sendSuccess } from '../utils.js'
import Property from '#models/property'
import PropertyTenant from '#models/property_tenant'
import RentalInvoice from '#models/rental_invoice'
import db from '@adonisjs/lucid/services/db'
// import WalletPayment from '#models/wallet_payment'
// import MaintenanceRequest from '#models/maintenance_request'

export default class AnalyticsController {

    async propertyAnalytics({ auth,response }:HttpContext){
        try {
            const user = auth.use('api').user!
            const totalProperties = await Property.query().where('owner_id','=',user.id).select(['id'])
            const ids:string[] = []
            totalProperties.forEach((e)=>ids.push(e.id))
            const renters = await PropertyTenant.query()
            .select(['id','property_id'])
            .whereIn('property_id',ids)
            .andWhere('payment_status','=','paid')
            const uniqueRentedProperties:string[] = []
            renters.forEach((e)=>{
                if(!uniqueRentedProperties.includes(e.property_id)){
                    uniqueRentedProperties.push(e.property_id)
                }
            })
            const pendingPayments = await RentalInvoice.query().whereIn('property_id',ids)
            .andWhere('status','=','unpaid').count('id','total')
            return sendSuccess(response,{
                message:"Analytics",
                data:{
                    total_properties:totalProperties.length,
                    total_rented_properties:uniqueRentedProperties.length,
                    total_renters: renters.length,
                    pending_payments: pendingPayments[0].$extras.total
                }
            })
        } catch (error) {
            return sendError(response,{message:error.message,code:500})
        }
    }


    public async userProfile({ auth, response }:HttpContext){
        try {
            const user = auth.use('api').user!
            const totalTenants = await PropertyTenant
            .query()
            .join('properties','property_tenants.property_id', '=', 'properties.id')
            .where((q)=>{
                q.whereRaw('properties.listing_type = ? AND property_tenants.payment_status = ? AND properties.owner_id = ?',['rent','paid',user.id])
            })
            .count('property_tenants.id','tenants')

            const totalIncome = await RentalInvoice
            .query()
            .join('properties','rental_invoices.property_id', '=', 'properties.id')
            .where((q)=>{
                q.whereRaw('rental_invoices.status = ? AND properties.owner_id = ?',['paid',user.id])
            })
            .sum('rental_invoices.total_amount','income')

            const totalTenantApplications = await PropertyTenant
            .query()
            .join('properties','property_tenants.property_id', '=', 'properties.id')
            .where((q)=>{
                q.whereRaw('properties.listing_type = ? AND property_tenants.status = ? AND properties.owner_id = ?',
                    ['rent','in-progress',user.id])
            })
            .count('property_tenants.id','tenants')

            const totalPendingPayment = await RentalInvoice
            .query()
            .join('properties','rental_invoices.property_id', '=', 'properties.id')
            .where((q)=>{
                q.whereRaw('rental_invoices.status = ? AND properties.owner_id = ?',['unpaid',user.id])
            })
            .sum('rental_invoices.total_amount','income')

            const summary = {
                totalTenants:Number(totalTenants[0]?.$extras?.tenants) || 0,
                totalIncome:Number(totalIncome[0]?.$extras?.income) || 0,
                totalTenantApplications:Number(totalTenantApplications[0]?.$extras?.tenants) || 0,
                totalPendingPayment:Number(totalPendingPayment[0]?.$extras?.income) || 0,
                maintenanceRequestSummary: await this.maintenanceAnalytic(user?.id)
                //topSelling: await this.topSelling(user?.id)
            }

            return sendSuccess(response,{message:"Profile Analytic", data:summary})
        } catch (error) {
            return sendError(response,{message:error.message, code: 500})
        }
    }

    public async topSelling({ auth,response }:HttpContext){
        try {
            const user = auth.use('api').user
            const properties = await Property
            .query()
            .select(['total_reviews','total_rating','total_views','total_purchases','property_title','id','currency_id'])
            .where('owner_id','=',user?.id!) //WILL ADD CONTIDION OF total_purchases greater than 1
            .preload('currency',(currency)=>{
                currency.select(['name','symbol','id','code','decimal_digits','symbol_native'])
            })
            .orderByRaw(`total_purchases DESC,total_rating`)
            .limit(10)
            const props:Array<unknown>= []
            for(const property of properties){
                const uniqueInvoices = await RentalInvoice
                .query()
                .distinctOn('tenant_id')
                .where('property_id','=',property.id)
                .andWhere('status','=','paid')
                .groupBy('tenant_id')
                .sum('total_amount','total')
                props.push({
                    ...property?.$attributes,
                    currency:property?.currency,
                    rentPaid: Number(uniqueInvoices[0]?.$extras?.total)
                })
            }
            return sendSuccess(response,{message:"Top Selling Properties", data:props})
        } catch (error) {
            return sendError(response,{message:error.message,code:500})
        }
    }


    async maintenanceAnalytic(owner_id:string){
        const query = await db.rawQuery(`
            SELECT 
            COUNT(CASE WHEN status = 'rejected' THEN 1 END)::INTEGER as rejected,
            COUNT(CASE WHEN status = 'done' THEN 1 END)::INTEGER as completed,
            COUNT(CASE WHEN status = 'ongoing' THEN 1 END)::INTEGER as ongoing,
            COUNT(CASE WHEN status = 'pending' THEN 1 END)::INTEGER as pending
            FROM maintenance_requests
            WHERE owner_id = '${owner_id}'`)
        return query.rows[0]
    }

    public async applicantAnalytic({ auth, response }:HttpContext){
        try {
            const user = auth.use('api').user!

            const query = await db.rawQuery(`
                SELECT 
                COUNT(CASE WHEN status = 'in-progress' THEN 1 END)::INTEGER as in_progress,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END)::INTEGER as rejected,
                COUNT(CASE WHEN status = 'approved' THEN 1 END)::INTEGER as approved,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::INTEGER as cancelled
                FROM property_tenants
                WHERE property_owner_id = '${user.id}'`)

            return sendSuccess(response,{data:query.rows[0],message:'Application analytics'})
        } catch (error) {
            return sendError(response,{message:error.message, code:500})
        }
    }

    // public async incomeSummary({ request,auth,response}:HttpContext){
    //     try {
    //         const user = auth.use('api').user!
    //         type Filter = '7 days'|'3 days'|'1 month'|'3 months'|'6 months'|'1 year'
    //         const date:Filter = request.params()
    //         const now = new Date()
    //         //this will also be the end date for prev calcultion
    //         const startDate = date == '1 month' ? now.getTime() - (3600 * 24 * 30 * 1000) :
    //                         date == '1 year' ? now.getTime() - (3600 * 24 * 365 * 1000) :
    //                         date == '3 days' ? now.getTime() - (3600 * 24 * 3 * 1000) :
    //                         date == '3 months' ? now.getTime() - (3600 * 24 * 90 * 1000) :
    //                         date == '6 months' ? now.getTime() - (3600 * 24 * 180 * 1000) :
    //                         date == '7 days' ? now.getTime() - (3600 * 24 * 7 * 1000) : 0
    //         //Total Income
    //         const totalIncome = await RentalInvoice
    //         .query()
    //         .join('properties','rental_invoices.property_id', '=', 'properties.id')
    //         .where((q)=>{
    //             q.whereRaw('rental_invoices.status = ? AND properties.owner_id = ? AND created_at BETWEEN ? AND ?',
    //                 ['paid',user.id,new Date(startDate),now])
    //         })
    //         .sum('rental_invoices.total_amount','income')
    //         const totalIncomePrev = await RentalInvoice
    //         .query()
    //         .join('properties','rental_invoices.property_id', '=', 'properties.id')
    //         .where((q)=>{
    //             q.whereRaw('rental_invoices.status = ? AND properties.owner_id = ? AND created_at <= ?',
    //                 ['paid',user.id,new Date(startDate)])
    //         })
    //         .sum('rental_invoices.total_amount','income')


    //         const totalExpense = await WalletPayment
    //         .query()
    //         .join('wallets','wallet_payments.wallet_id', '=', 'wallets.id')
    //         .where((q)=>{
    //             q.whereRaw('wallet_payments.payment_status = ? AND wallets.user_id = ? AND transaction_type IN ? AND created_at BETWEEN ? AND ?',
    //                 ['completed',user.id,['WITHDRAWAL','DEBIT'],new Date(startDate),now])
    //         })
    //         .sum('wallet_payments.amount_paid','expense')
    //         const totalExpensePrev = await WalletPayment
    //         .query()
    //         .join('wallets','wallet_payments.wallet_id', '=', 'wallets.id')
    //         .where((q)=>{
    //             q.whereRaw('wallet_payments.payment_status = ? AND wallets.user_id = ? AND transaction_type IN ? AND created_at BETWEEN ? AND ?',
    //                 ['completed',user.id,['WITHDRAWAL','DEBIT'],new Date(startDate),now])
    //         })
    //         .sum('wallet_payments.amount_paid','expense')


    //         const rentReceived = await PropertyTenant
    //         .query()
    //         .join('properties','property_tenants.property_id', '=', 'properties.id')
    //         .where((q)=>{
    //             q.whereRaw('properties.listing_type = ? AND properties.owner_id = ? AND created_at BETWEEN ? AND ?',
    //                 ['rent',user.id,new Date(startDate),now])
    //         })
    //         .count('property_tenants.id','tenants')

    //         const rentReceivedPrev = await PropertyTenant
    //         .query()
    //         .join('properties','property_tenants.property_id', '=', 'properties.id')
    //         .where((q)=>{
    //             q.whereRaw('properties.listing_type = ? AND properties.owner_id = ? AND created_at BETWEEN ? AND ?',
    //                 ['rent',user.id,new Date(startDate),now])
    //         })
    //         .count('property_tenants.id','tenants')


    //         const maintenance = await MaintenanceRequest.query()
    //         .where((q)=>{
    //             q.whereRaw(`owner_id = ? AND created_at BETWEEN ? AND ?`,[user.id,new Date(startDate),now])
    //         }).count('id','total')

    //         const maintenancePrev = await MaintenanceRequest.query()
    //         .where((q)=>{
    //             q.whereRaw(`owner_id = ? AND created_at <= ?`,[user.id,new Date(startDate)])
    //         }).count('id','total')

    //     } catch (error) {
    //         return sendError(response,{message:error.message, code:500})
    //     }
    // }
}