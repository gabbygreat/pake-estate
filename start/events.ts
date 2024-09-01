import emitter from '@adonisjs/core/services/emitter'
import SaveMessageEvent from '#listeners/save_message'

//@ts-ignore
emitter.on('message:persist',[SaveMessageEvent, 'handle'])