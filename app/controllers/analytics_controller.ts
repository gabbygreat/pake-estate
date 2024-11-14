/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import type { HttpContext } from '@adonisjs/core/http'
import { sendError, sendSuccess } from '../utils.js'
import Property from '#models/property'
import PropertyTenant from '#models/property_tenant'
import RentalInvoice from '#models/rental_invoice'
import db from '@adonisjs/lucid/services/db'

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
            .select(['total_reviews','total_rating','total_views','total_purchases','property_title','id'])
            .where('owner_id','=',user?.id!)
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
                    ...property.$attributes,
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
}