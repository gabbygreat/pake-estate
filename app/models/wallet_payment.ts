import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { belongsTo } from '@adonisjs/lucid/orm'
import Wallet from './wallet.js'
import Currency from './currency.js'

export default class WalletPayment extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare wallet_id: string

  @column()
  declare amount_paid: string

  @column()
  declare description: string

  @column()
  declare currency_id: string

  @column()
  declare payment_status:'completed'|'pending'|'failed'

  @column()
  declare transaction_type:'DEPOSIT'|'WITHDRAWAL'|'TRANSFER'

  @column()
  declare payment_gateway: string

  @column()
  declare payment_reference: string

  @column()
  declare channel_payment_id: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(()=>Wallet,{foreignKey:'wallet_id', localKey:'id'})
  declare wallet:BelongsTo<typeof Wallet>

  @belongsTo(()=>Currency,{foreignKey:'currency_id', localKey:'id'})
  declare currency:BelongsTo<typeof Currency>
}