
export default class NotificationService {
    message() {
        return {
            "RENTAL_APPLICATION_SUBMISSION": ({property_name}:{property_name:string}) => {
                return { 
                    title: `Rental Application Submitted`, 
                    message: `Your rental application for ${property_name} has been successfully submitted. We will notify you once it's reviewed.`,
                    type: 'info' 
                }
            },
            "RENTAL_APPLICATION_ACCEPTANCE": ({property_name}:{property_name:string}) => {
                return { 
                    title: `Rental Application Accepted`, 
                    message: `Congratulations! Your rental application for ${property_name} has been accepted.Please check your email for the next steps. (is that the next step) .`,
                    type: 'success'  
                }
            },
            "RENTAL_APPLICATION_REJECTION": ({property_name}:{property_name:string}) => {
                return { 
                    title: `Rental Application Rejected`, 
                    message: `We regret to inform you that your rental application for ${property_name} has been rejected. You can contact landlord for more details .`,
                    type: 'error' 
                }
            },
            "RENTAL_CANCELLATION": ({property_name}:{property_name:string}) => {
                return { 
                    title: `Rental Application Cancelled`, 
                    message: `Your rental application for ${property_name} has been cancelled. If you did not initiate this, please contact support.`,
                    type: 'warning'              }
            },
            "RENTAL_PAYMENT_NOTIFICATION": ({property_name,date}:{property_name:string,date:any}) => {
                return { 
                    title: `Rental Payment Due`, 
                    message: `This is a reminder that your rental payment for ${property_name} is due on ${date as any}. Please ensure payment is made on time to avoid penalties.`,
                    type: 'reminder'      
                }        
            },
            "NEW_REVIEW_NOTIFICATION": ({property_name}:{property_name:string}) => {
                return {
                    title: `New Review Received`,
                    message: `You have received a new review for ${property_name}. Check the details in your account.`,
                    type: 'info'  
                }
            }
        }
    }
}