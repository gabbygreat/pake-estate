/* eslint-disable @typescript-eslint/ban-ts-comment */
//import app from '@adonisjs/core/services/app'
import ws_service from '#services/ws_service'
import Message from '#models/message'
import emitter from '@adonisjs/core/services/emitter'
// import { createAdapter } from "@socket.io/redis-adapter";
// import { Redis } from "ioredis";
// import env from '#start/env'

interface OnlineStat{
    senderId: string,
    ref_userId: string
}

ws_service.boot()
const io = ws_service.io

// app.start(() => {
  // var subClient;
  // var pubClient;
  // (async()=>{

  //   pubClient = new Redis({
  //     host: env.get('REDIS_HOST') as any,
  //     port: env.get('REDIS_PORT') as any,
  //     password: env.get('REDIS_PASSWORD') as any,
  //   });
    
  //   pubClient.on('connect',()=>{
  //     console.log("Connected to socket adapter")
  //     return;
  //   })

  //   pubClient.on('error',()=>{
  //     console.error("Error connecting to socker adapter")
  //     return;
  //   })

  //   subClient = pubClient.duplicate();

  //   io?.adapter(createAdapter(pubClient, subClient))
  
  // })()


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

      socket.on('echo',()=>{
        io.to(socket.id).emit('echo',{message:'Server is Active!'})
      })

    })

    //TODO::HANDLE DISCONNECTION AND FREEING ROOMS


//})