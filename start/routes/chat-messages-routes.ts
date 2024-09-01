import router from "@adonisjs/core/services/router";
import MessagesController from "#controllers/messages_controller";
import { middleware } from "#start/kernel";
router.group(()=>{

    router.post('upload-files',[MessagesController, 'handleFileUpload']).use(middleware.auth({guards:['api']}))
    router.delete('file/:chat_id/:file_name', [MessagesController, 'removeFile']).use(middleware.auth({guards:['api']}))

}).prefix('/chat')