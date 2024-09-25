import type { HttpContext } from '@adonisjs/core/http'

import { sendError, sendSuccess } from "../utils.js";
import Currency from '#models/currency';
import ClientCurrency from '#models/client_currency';
import Wallet from '#models/wallet';

export default class WalletsController {

    async fundWallet(){
        try {
            
        } catch (error) {
            
        }
    }

    async walletBalanceInfo(){
        try {
            
        } catch (error) {
            
        }
    }

    async withdraw(){
        try {
            
        } catch (error) {
            
        }
    }

    async transfer(){
        try {
            
        } catch (error) {
            
        }
    }

    async transactionHistory(){
        try {
            
        } catch (error) {
            
        }
    }

    async supportedCurrency({ auth,response }:HttpContext){
        try {
            const user = auth.use('api').user!
            console.log(user.id)
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
            console.log(error)
            return sendError(response,{message:"Error checking balance"})
        }
    }
}