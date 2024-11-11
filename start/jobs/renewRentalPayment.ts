import { CronJob } from 'cron'
import RentalInvoice from '#models/rental_invoice'
import PropertyTenant from '#models/property_tenant'
import RentalInvoiceService from '#services/rentalinvoice_service'
//import Notification from '#models/notification'
const rentalInvoiceService = new RentalInvoiceService()
let isChecking = false
const job = new CronJob(
  '* * * * *', // cronTime
  async function () {
    if (!isChecking) {
      isChecking = true
      try {
        const tenants = await PropertyTenant.query()
          .select(['id'])
          .where('status', '=', 'approved')
          .andWhere('payment_status', '=', 'paid')
        for (const tenant of tenants) {
          const records = await RentalInvoice.query()
            .select('*')
            .where((q) => {
              q.whereRaw(`tenant_id = ?`, [tenant.id])
            })
            .orderBy('created_at', 'desc')
            .first()
          if (records && records.next_payment_date <= new Date()) {
            await rentalInvoiceService.generateInvoice(tenant.id)
            // await Notification.create({
            //     user_id: record.applicant_id,
            //     title: notificationTemplate.title,
            //     message: notificationTemplate.message,
            //     type: notificationTemplate.type,
            //     actor_refs: JSON.stringify([currentUser]),
            //     entity_ids: JSON.stringify({
            //       property_id: record.property_id,
            //       tenancy_application_id: record.id,
            //     }),
            //     slug: 'RENTAL_APPLICATION_ACCEPTANCE',
            //   })
          }
        }
        // console.log(records)
      } catch {
        isChecking = false
      }
    }
    isChecking = false
  }, // onTick
  null, // onComplete
  true, // start
  'UTC' // timeZone
)

export default job
