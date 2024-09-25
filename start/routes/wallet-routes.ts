import router from "@adonisjs/core/services/router";
import WalletsController from "#controllers/wallets_controller";
import { middleware } from '#start/kernel'

router.group(()=>{

    router.get('currencies',[WalletsController,'supportedCurrency']).use(middleware.auth({guards:['api']}))
}).prefix('/wallet')