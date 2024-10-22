import router from "@adonisjs/core/services/router";
import PropertyController from "#controllers/properties_controller";
import { middleware } from "#start/kernel";

router.group(()=>{

    router.post('compose-property',[PropertyController,'composeProperty']).use(middleware.auth({guards:['api']}))
    router.delete('remove-property-media/:media_id',[PropertyController,'removePropertyMedia']).use(middleware.auth({guards:['api']}))
    router.get('list-property-media/:property_id',[PropertyController,'listPropertyMedia'])
    router.get('list-properties',[PropertyController,'listProperties'])
    router.get('info/:id',[PropertyController,'propertyInfo'])
    router.post('review',[PropertyController,'submitReview']).use(middleware.auth({guards:['api']}))
    router.get('review-summary',[PropertyController,'propertyReviewSummary'])
    router.get('my-review',[PropertyController,'userPropertyReview']).use(middleware.auth({guards:['api']}))
    router.get('top-selling',[PropertyController,'topSellingProperties'])
    router.patch('publish',[PropertyController,'publishProperty']).use(middleware.auth({guards:['api']}))
    router.get('hide-property/:id',[PropertyController,'hideProperty']).use(middleware.auth({guards:['api']}))
    router.get('list-save-properties',[PropertyController,'listSaveProperty']).use(middleware.auth({guards:['api']}))
    router.delete('remove/:id',[PropertyController,'deleteProperty']).use(middleware.auth({guards:['api']}))
    router.delete('delete-review/:id',[PropertyController,'deleteReview']).use(middleware.auth({guards:['api']}))
    router.post('save-property',[PropertyController,'saveProperty']).use(middleware.auth({guards:['api']}))
    router.get('location-search-hint/:location',[PropertyController,'searchLocationHint'])
    router.get('my-rented-properties',[PropertyController, 'rentedProperties']).use(middleware.auth({guards:['api']}))
    
}).prefix('/property')