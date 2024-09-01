import app from '@adonisjs/core/services/app'
import ws_service from '#services/ws_service'
import Message from '#models/message'
import emitter from '@adonisjs/core/services/emitter'

interface OnlineStat{
    senderId: string,
    ref_userId: string
}

app.ready(() => {
    ws_service.boot()
    const io = ws_service.io

    io?.on('connection', (socket) => {
      console.log(socket.id)

      socket.on('login',({userId}:{userId:string})=>{
        socket.join(userId)
      })

      socket.on('message',async(data:Partial<Message>)=>{
        if(socket.rooms.has(data.receiver_id!)){ //If receiver is online
            //@ts-ignore
            emitter.emit('message:persist',{...data.$attributes,read_status:true})
            io.to(data.receiver_id!).emit('message',data)
        }else{
            //@ts-ignore
            emitter.emit('message:persist',{...data.$attributes,read_status:true})
        }
      })

      socket.on("online_status",(stat:OnlineStat)=>{
        if(socket.rooms.has(stat.ref_userId)){
            io.to(stat.senderId).emit("online_status",{status:true})
        }else{
            io.to(stat.senderId).emit("online_status",{status:false})
        }
      })

    })

    //TODO::HANDLE DISCONNECTION AND FREEING ROOMS


})