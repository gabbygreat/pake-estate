import Message from "#models/message";

export default class SaveMessageEvent {
    async handle(message:Partial<Message>){
        try {
            await Message.create({
                text_content: message.text_content,
                files: message.files ? JSON.stringify(message.files) : JSON.stringify([]),
                sender_id: message.sender_id,
                receiver_id: message.receiver_id
            })
          } catch {/** */}
    }
}