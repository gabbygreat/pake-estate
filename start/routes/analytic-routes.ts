import router from "@adonisjs/core/services/router";
import AnalyticsController from "#controllers/analytics_controller";
import { middleware } from "#start/kernel";
router.group(()=>{

    router.get('dashboard',[AnalyticsController, 'propertyAnalytics']).use(middleware.auth({guards:['api']}))

}).prefix('/analytic')