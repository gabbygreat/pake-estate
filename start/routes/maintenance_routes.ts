import router from "@adonisjs/core/services/router";
import MaintenanceController from "#controllers/maintenance_controller";
import { middleware } from "#start/kernel";

router.group(()=>{

    router.post('new',[MaintenanceController,'composeRequest'])
    router.patch('status',[MaintenanceController,'updateRequestStatus'])
    router.get('all',[MaintenanceController,'listRequest'])
    router.delete('/:id',[MaintenanceController,'deleteRequest'])

}).prefix('/maintenance/request').use(middleware.auth({guards:['api']}))