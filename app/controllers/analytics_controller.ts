import type { HttpContext } from '@adonisjs/core/http'
import { sendError, sendSuccess } from '../utils.js'
import Property from '#models/property'
import PropertyTenant from '#models/property_tenant'
import RentalInvoice from '#models/rental_invoice'

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
}