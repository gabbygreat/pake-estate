import router from "@adonisjs/core/services/router";
import RentalInvoicesController from "#controllers/rental_invoices_controller";
import { middleware } from "#start/kernel";

router.group(()=>{

    router.get('all',[RentalInvoicesController,'allInvoices']).use(middleware.auth({guards:['api']}))
    router.get('info/:id',[RentalInvoicesController, 'invoiceInformation'])
    router.get('pay-rent/:id',[RentalInvoicesController,'processPayment'])

}).prefix('/invoice')