import router from "@adonisjs/core/services/router";
import PropertyController from "#controllers/properties_controller";

router.group(()=>{

    router.post('compose-property',[PropertyController,'composeProperty'])
    router.delete('remove-property-media',[PropertyController,'removePropertyMedia'])
    router.get('list-property-media',[PropertyController,'listPropertyMedia'])
    router.get('list-properties',[PropertyController,'listProperties'])
    router.get('info/:id',[PropertyController,'propertyInfo'])
    router.post('review',[PropertyController,'submitReview'])
    router.get('review-summary',[PropertyController,'propertyReviewSummary'])
    router.get('top-selling',[PropertyController,'topSellingProperties'])

}).prefix('/property')