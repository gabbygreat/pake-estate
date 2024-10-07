import router from "@adonisjs/core/services/router";
import CurrenciesController from "#controllers/currencies_controller";

router.group(()=>{

    router.get('supported',[CurrenciesController,'supportedCurrency'])

}).prefix('/currency')