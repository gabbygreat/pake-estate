
export default class NotificationService {
    message(){
        return {
            "RENTAL_APPLICATION_SUBMISSION": ()=>{
                return { 
                    title:``, 
                    message:``
                }
            },
            'RENTAL_APPLICATION_ACCEPTANCE':()=>{
                return { 
                    title:``, 
                    message:``
                }
            },
            "RENTAL_APPLICATION_REJECTION":()=>{
                return { 
                    title:``, 
                    message:``
                }
            },
            "RENTAL_CANCELLATION":()=>{
                return { 
                    title:``, 
                    message:``
                }
            },
            "RENTAL_PAYMENT_NOTIFICATION":()=>{
                return { 
                    title:``, 
                    message:``
                }
            },
            "NEW_REVIEW_NOTIFICATION":()=>{
                return {
                    title: ``,
                    message: ``
                }
            }
        }
    }
}