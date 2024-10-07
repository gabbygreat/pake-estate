import type { HttpContext } from '@adonisjs/core/http'
import Currency from '#models/currency'
import { sendError, sendSuccess } from '../utils.js'
export default class CurrenciesController {

    async supportedCurrency({response }:HttpContext){
        try {
            const currencies = await Currency.query().select([]).where('supported','=',true)
            return sendSuccess(response,{message:"Currencies", data:currencies})
        } catch (error) {
            return sendError(response,{message:error.message,code:500})
        }
    }
}