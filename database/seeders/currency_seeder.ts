/* eslint-disable @typescript-eslint/ban-ts-comment */
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Currency from '#models/currency'
import { currencies } from '#services/currency_service'
export default class extends BaseSeeder {
  async run() {
    // Write your database queries inside the run method
    const formated:Array<Partial<Currency>> = []
    const keys:string[] = Object.keys(currencies)
    keys.forEach((k)=>{
      formated.push({
        //@ts-ignore
        name: currencies[k].name,
        //@ts-ignore
        code: currencies[k].code,
        //@ts-ignore
        symbol: currencies[k].symbol,
        //@ts-ignore
        symbol_native: currencies[k].symbol_native,
        //@ts-ignore
        decimal_digits: currencies[k].decimal_digits,
        //@ts-ignore
        rounding: currencies[k].rounding,
        //@ts-ignore
        name_plural: currencies[k].name_plural,
        supported: k === 'USD' ? true : false
      })
    })
    await Currency.updateOrCreateMany('code',formated)
  }
}