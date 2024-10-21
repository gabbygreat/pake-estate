import router from "@adonisjs/core/services/router";
import WalletsController from "#controllers/wallets_controller";
import { middleware } from '#start/kernel'

router.group(()=>{

    router.get('currencies',[WalletsController,'supportedCurrency']).use(middleware.auth({guards:['api']}))
    router.get('balance-info/:currencyId',[WalletsController,'walletBalanceInfo']).use(middleware.auth({guards:['api']}))
    router.post('fund',[WalletsController,'fundWallet']).use(middleware.auth({guards:['api']}))
    router.post('stripe-x-hook',[WalletsController,'stripeMC_Call_xtx'])
    router.get('payment-history',[WalletsController, 'transactionHistory']).use(middleware.auth({guards:['api']}))
}).prefix('/wallet')