import router from "@adonisjs/core/services/router";
import PropertyController from "#controllers/properties_controller";

router.group(()=>{
    router.post('composeProperty',[PropertyController,'composeProperty'])
    router.delete('removePropertyMedia',[PropertyController,'removePropertyMedia'])
    router.get('listPropertyMedia',[PropertyController,'listPropertyMedia'])
    router.get('listProperties',[PropertyController,'listProperties'])

}).prefix('/property')