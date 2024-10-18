/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import emitter from '@adonisjs/core/services/emitter'
import SaveMessageEvent from '#listeners/save_message'
import { WebHookObject } from '#services/wallet_service'
import WalletPayment from '#models/wallet_payment'
import Wallet from '#models/wallet'

//@ts-ignore
emitter.on('message:persist',[SaveMessageEvent, 'handle'])
//@ts-ignore
emitter.on('checkout_success_stripe', async (data: WebHookObject) => {
    try {
      console.log(`stripe success data `,data)
      const reference = data?.client_reference_id!
      const payment_id =  data.payment_intent
      const payment = await WalletPayment.findBy('payment_reference',reference)
      if(payment && payment.payment_status === 'pending'){
        const wallet = await Wallet.find(payment.wallet_id)
        if(wallet){
            wallet.balance += Number(payment.amount_paid)
            await wallet.save()
            payment.payment_status = 'completed'
            payment.channel_payment_id = payment_id
            await payment.save()
        }
      }
    } catch (e) {
      console.log(e)
    }
  })