/* eslint-disable @typescript-eslint/no-explicit-any */
import { CronJob } from 'cron'
import PropertyTenant from '#models/property_tenant'
import RentalInvoice from '#models/rental_invoice'
let isChecking = false
const job1 = new CronJob(
  '* * * * *', // cronTime
  async function () {
    if (!isChecking) {
      isChecking = true
      try {
        console.log("CHECKING EXEEDED GRACE ")
        const now = new Date()
        const tenants = await PropertyTenant.query()
          .select('*')
          .where('status', '=', 'approved')
          .andWhere('payment_status', '=', 'unpaid')
          .andWhere('rent_payment_grace_period','<',now)
          console.log(tenants.length)
        for(const tenant of tenants){
            tenant.rent_payment_grace_period = null as any
            tenant.approval_date = null as any
            tenant.status = 'rejected'
            await tenant.save()
            await RentalInvoice.query().where((q)=>q.where('tenant_id=? AND property_id=?',[tenant.id,tenant.property_id])).delete()
        }
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

export default job1
