import router from "@adonisjs/core/services/router";
import TenantsController from "#controllers/tenants_controller";
import { middleware } from "#start/kernel";

router.group(()=>{

    router.post('apply',[TenantsController,'sendApplication']).use(middleware.auth({guards:['api']}))
    router.get('list',[TenantsController,'tenantListing']).use(middleware.auth({guards:['api']}))
    router.get('info/:tenant_id',[TenantsController,'applicationInfo'])
    router.get('applications',[TenantsController,'tenantRequests']).use(middleware.auth({guards:['api']}))
    router.patch('handle-application/:tenant_id/:status',[TenantsController,'updateApplicationStatus']).use(middleware.auth({guards:['api']}))
}).prefix('/tenant')