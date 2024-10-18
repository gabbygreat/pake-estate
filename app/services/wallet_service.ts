/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import WalletPayment from "#models/wallet_payment"
import env from "#start/env"
import { cuid } from "@adonisjs/core/helpers"
import Stripe from 'stripe'

export const stripe = new Stripe(env.get('STRIPE_SECRET_KEY'))

export default class WalletService{

    async createStripePaymentLink(
        amount: number,
        currency_code: string,
        reference: string,
        email: string,
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
            success_url: `${env.get('STRIPE_RESPONSE_URL')}dashboard/property-management-system/landlord/financial-reports?currentTab=Transcation+History&fundStatus=successful`,
            cancel_url: `${env.get('STRIPE_RESPONSE_URL')}dashboard/property-management-system/landlord/financial-reports?currentTab=Transcation+History&fundStatus=failed`,
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
            console.log("REFERENCE ",ref)
            await WalletPayment.create({...data,payment_reference:ref})
            return ref
        } catch (error) {
            return null
        }
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
  