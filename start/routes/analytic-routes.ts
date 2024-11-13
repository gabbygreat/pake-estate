import router from "@adonisjs/core/services/router";
import AnalyticsController from "#controllers/analytics_controller";
import { middleware } from "#start/kernel";
router.group(()=>{

    router.get('dashboard',[AnalyticsController, 'propertyAnalytics'])
    router.get('profile', [AnalyticsController, 'userProfile'])
    router.get('top-selling-properties',[AnalyticsController, 'topSelling'])
}).prefix('/analytic').use(middleware.auth({guards:['api']}))