import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { compose } from '@adonisjs/core/helpers'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import hash from '@adonisjs/core/services/hash'
import type { HasOne } from '@adonisjs/lucid/types/relations'
import { hasOne } from '@adonisjs/lucid/orm'
import HomePage from './home_page.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class Admin extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare fullname: string
  
  @column()
  declare email: string

  @column()
  declare background_Image: string

  @column()
  declare banner_Image: string

  @column()
  declare email_verified: boolean

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasOne(()=>HomePage,{foreignKey:'id', localKey:'homepage_id'})
  declare owner:HasOne<typeof HomePage>

  static accessTokens = DbAccessTokensProvider.forModel(Admin,{
    expiresIn: '1 days',
    prefix: 'oat_',
    table: 'admin_access_tokens',
    type: 'auth_token',
    tokenSecretLength: 50,
  })
}