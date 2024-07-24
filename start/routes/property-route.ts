import router from "@adonisjs/core/services/router";
import PropertyController from "#controllers/properties_controller";

router.group(()=>{

    router.post('compose-property',[PropertyController,'composeProperty'])
    router.delete('remove-property-media',[PropertyController,'removePropertyMedia'])
    router.get('list-property-media',[PropertyController,'listPropertyMedia'])
    router.get('list-properties',[PropertyController,'listProperties'])

}).prefix('/property')