/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable prefer-const */
/* eslint-disable no-fallthrough */
/* eslint-disable no-case-declarations */
import type { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter';
import { sendError, sendSuccess } from "../utils.js";
import Currency from '#models/currency';
import ClientCurrency from '#models/client_currency';
import Wallet from '#models/wallet';
import db from '@adonisjs/lucid/services/db';
import WalletService, { WebHookAccRef, WebHookObject } from '#services/wallet_service';
import { inject } from '@adonisjs/core';

@inject()
export default class WalletsController {

    constructor(
        protected walletService:WalletService
    ){

    }

    async fundWallet({ request,auth,response}:HttpContext){
        try {
            const user = auth.use('api').user

            const { wallet_id, payment_method, amount } = request.body()
            const wallet = await Wallet.query()
            .select('*').whereRaw('id = ? AND user_id = ?',[wallet_id,user?.id!])
            .preload('currency',(currency)=>{
                currency.select(['code'])
            })
            switch(payment_method){
                case 'stripe':
                    const ref = await this.walletService.createDepositPayment({
                        wallet_id,
                        currency_id:wallet[0].currency_id,
                        amount_paid:amount,
                        payment_gateway: 'stripe',
                        transaction_type:'DEPOSIT'
                    })
                    if(ref){
                        const {error,data} = await this.walletService.createStripePaymentLink(amount,wallet[0].currency.code,ref,user?.email!)
                        if(!error){
                            return sendSuccess(response,{message:"Payment link generated", data})
                        }
                    }
                default:
                    return sendError(response,{message:"Invalid payment method selected"})
            }
        } catch (error) {
            return sendError(response,{message:"Error funding wallet", code:500})
        }
    }

    async walletBalanceInfo({ request,auth,response}:HttpContext){
        try {
            const { currencyId } = request.params()
            const user = auth.use('api').user!
            const walletBalance = await Wallet.query()
            .select(['id','balance']).where((q)=>q.whereRaw(`currency_id = ? AND user_id = ?`,[currencyId,user.id]))
            const query = await db.rawQuery(`
                SELECT
                    (SELECT SUM(amount_paid)
                    FROM wallet_payments
                    WHERE currency_id = '${currencyId}'
                    AND payment_status = 'completed'
                    AND wallet_id = '${walletBalance[0].id}'
                    AND transaction_type = 'DEPOSIT') AS total_received,

                    (SELECT SUM(amount_paid)
                    FROM wallet_payments
                    WHERE currency_id = '${currencyId}'
                    AND payment_status = 'completed'
                    AND wallet_id = '${walletBalance[0].id}'
                    AND (transaction_type = 'WITHDRAW' OR transaction_type='TRANSFER')) AS total_sent;

        `)
        const balances = query.rows[0]
        balances.total_received = Number(balances.total_received)
        balances.total_sent = Number(balances.total_sent)
        return sendSuccess(response,{message:"Wallet Balance", data:{balances,wallet:walletBalance[0]}})
        } catch (error) {
            console.log(error)
            return sendError(response,{message:"Error fetching wallet balance info", code:500})
        }
    }

    // async withdraw({ request,auth,response}:HttpContext){
    //     try {
            
    //     } catch (error) {
    //         return sendError(response,{message:"Error withdrawing from wallet", code:500})
    //     }
    // }

    // async transfer({ request,auth,response}:HttpContext){
    //     try {
            
    //     } catch (error) {
    //         return sendError(response,{message:"Error during transfer from wallet", code:500})
    //     }
    // }

    // async transactionHistory({ request,auth,response}:HttpContext){
    //     try {
            
    //     } catch (error) {
            
    //     }
    // }

    async supportedCurrency({ auth,response }:HttpContext){
        try {
            const user = auth.use('api').user!
            //Pull out from the General Supported currency into the client currency
            const currencies = await Currency.query().select(['id','code']).where('supported','=',true)
            for(const c of currencies){
                //If user does not have the currency in the client currency,add it
                const check = await ClientCurrency.query().select(['id','default_currency']).where((q)=>q.whereRaw('currency_id = ? AND user_id = ?',[c.id,user.id]))
                if(!check[0]){
                    await ClientCurrency.create({currency_id:c.id,user_id:user.id,supported:true})
                    await Wallet.create({currency_id:c.id,balance:0,user_id:user.id})
                }
            }
            //Make one default if none for the user
            const clientCurrencies = await ClientCurrency
            .query()
            .select('*')
            .preload('currency',(c)=>{
                c.select(['name','code'])
            })
            .where((q)=>q.whereRaw('user_id = ?',[user.id]))
            const defaultCurrency = clientCurrencies.filter((e)=>e.default_currency === true)
            if(!defaultCurrency.length){
                //No default currency
                clientCurrencies[0].default_currency = true
                await clientCurrencies[0].save()
            }
            return sendSuccess(response,{message:'All supported currencies',data:clientCurrencies})
        } catch (error) {
            return sendError(response,{message:"Error checking balance"})
        }
    }


    public async stripeMC_Call_xtx({ request, response }: HttpContext) {
        const { data, error } = await this.walletService.verifyStripeWHookReq(request.body())
        if (error) {
          return response.status(400).json({ error: true, message: 'Invalid request' })
        }
        try {
          let event = data
          switch (event.type) {
            case 'checkout.session.completed':
              //@ts-ignore
              await emitter.emit('checkout_success_stripe', event.data.object)
              break
            case 'payment_intent.succeeded':
              //@ts-ignore
              await emitter.emit('transaction_success_stripe', event.data.object as WebHookObject)
              break
            case 'charge.failed':
              break
            case 'payment_intent.payment_failed':
              //@ts-ignore
              await emitter.emit('transaction_failed_stripe', event.data.object as WebHookObject)
              break
            case 'checkout.session.expired':
              //@ts-ignore
              await emitter.emit('deposit_expired', event.data as WebHookAccRef)
              break
            default:
          }
          return response.status(200)
        } catch (error) {
          return response.status(500).json({ error: true, message: 'Network Error' })
        }
      }
}