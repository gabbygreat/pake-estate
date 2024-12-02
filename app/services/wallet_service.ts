/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import WalletPayment from "#models/wallet_payment"
import env from "#start/env"
import { cuid } from "@adonisjs/core/helpers"
import Stripe from 'stripe'
import { TransactionClientContract } from "@adonisjs/lucid/types/database"
import Wallet from "#models/wallet"

export const stripe = new Stripe(env.get('STRIPE_SECRET_KEY'))

export default class WalletService{

    async createStripePaymentLink(
        amount: number,
        currency_code: string,
        reference: string,
        email: string,
        success_url: string,
        error_url: string
      ) {
        try {
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ['link', 'card'],
            line_items: [
              {
                price_data: {
                  currency: currency_code.toLowerCase(),
                  product_data: { name: 'Order Payment' },
                  unit_amount: amount * 100,
                },
                quantity: 1,
              },
            ],
            client_reference_id: reference,
            metadata: { reference: reference },
            customer_email: email,
            mode: 'payment',
            success_url,
            cancel_url: error_url
          })
      
          return {
            error: false,
            message: 'Link created',
            data: { session: session, client_reference: reference },
          }
        } catch (error) {
          return { message: error.message, error: true }
        }
      }

     async verifyStripeWHookReq(body: any): Promise<any> {
        try {
          const payload = JSON.stringify(body, null, 2)
          const secret = env.get('STRIPE_ENDPOINT_SECRET')
          const header = stripe.webhooks.generateTestHeaderString({
            payload,
            secret,
          })
          const event = stripe.webhooks.constructEvent(payload, header, secret)
          return { message: 'valid request', error: false, data: event }
        } catch (e) {
          return { message: 'invalid request', error: true }
        }
      }

      async createDepositPayment(data:Partial<WalletPayment>){
        try {
            const ref = cuid()
            await WalletPayment.create({...data,payment_reference:ref})
            return ref
        } catch (error) {
            return null
        }
      }

      async creditWallet(
        {user_id,currency,amount,description,client}
        :{user_id:string,
          currency:string,
          amount:number,
          description:string,
          client:TransactionClientContract}){

          const wallet = await Wallet.query({client}).select('*')
          .where((q)=>q.whereRaw(`user_id = ? AND currency_id = ?`,[user_id,currency]))

          wallet[0].balance = Number(wallet[0].balance) + Number(amount)
          await wallet[0].useTransaction(client).save()

          await WalletPayment.create({
            wallet_id:wallet[0].id,
            currency_id:currency,
            amount_paid:amount,
            description,
            payment_gateway: 'Wallet',
            payment_reference: `cred_${cuid()}`,
            payment_status: 'completed',
            transaction_type: 'CREDIT'
          },{client})

      }

      async debitWallet(
        {user_id,currency,amount,description,client}
        :{user_id:string,
          currency:string,
          amount:number,
          description:string,
          client:TransactionClientContract}){

          const wallet = await Wallet.query({client}).select('*')
          .where((q)=>q.whereRaw(`user_id = ? AND currency_id = ?`,[user_id,currency]))
          console.log(wallet)
          wallet[0].balance = Number(wallet[0].balance) - Number(amount)
          await wallet[0].useTransaction(client).save()

          await WalletPayment.create({
            wallet_id:wallet[0].id,
            currency_id:currency,
            amount_paid:amount,
            description,
            payment_gateway: 'Wallet',
            payment_reference: `dep_${cuid()}`,
            payment_status: 'completed',
            transaction_type: 'DEBIT'
          },{client})

      }
}

export interface WebHookObject {
    id: string
    amount: number
    client_secret?: string
    payment_intent: string
    metadata: any
    last_payment_error?: any
    client_reference_id?: string
  }
  
  export interface WebHookAccRef {
    id: string
    livemode: boolean
    object: any
    type: any
    account: string
    pending_webhooks: number
    created: any
    data: any
  }
  