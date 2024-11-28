/* eslint-disable @typescript-eslint/no-explicit-any */
import Notification from "#models/notification"

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
            "RENTAL_APPLICATION_SUBMISSION_LANDLORD": ({property_name}:{property_name:string}) => {
                return { 
                    title: `Rental Application Received`, 
                    message: `You have a received a new rental application for property ${property_name}.`,
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
                    type: 'info' 
                }
            },
            "RENTAL_CANCELLATION": ({property_name}:{property_name:string}) => {
                return { 
                    title: `Rental Application Cancelled`, 
                    message: `Your rental application for ${property_name} has been cancelled. If you did not initiate this, please contact support.`,
                    type: 'warning'              }
            },
            "RENTAL_PAYMENT_DUE_NOTIFICATION": ({property_name,date}:{property_name:string,date:any}) => {
                return { 
                    title: `Rental Payment Due`, 
                    message: `This is a reminder that your rental payment for ${property_name} is due on ${date as any}. Please ensure payment is made on time to avoid penalties.`,
                    type: 'reminder'      
                }        
            },
            "RENTAL_PAYMENT_NOTIFICATION_FOR_LANDLORD": ({property_name, tenant_name, date}:{property_name:string, tenant_name:string, date:any}) => {
                return {
                    title: `Rental Payment Received`,
                    message: `Good news! The rental payment for your property, ${property_name}, from tenant ${tenant_name} has been successfully received on ${date}. Thank you for your continued partnership.`,
                    type: 'success'
                };
            },
            "RENTAL_PAYMENT_NOTIFICATION_FOR_TENANT": ({property_name, date}:{property_name:string, date:any}) => {
                return {
                    title: `Rental Payment Confirmation`,
                    message: `Thank you! Your rental payment for ${property_name} has been received on ${date}. We appreciate your timely payment.`,
                    type: 'confirmation'
                };
            },

            "NEW_REVIEW_NOTIFICATION": ({property_name}:{property_name:string}) => {
                return {
                    title: `New Review Received`,
                    message: `You have received a new review for ${property_name}. Check the details in your account.`,
                    type: 'info'  
                }
            },
            "MAINTENANCE_REQUEST": ({property_name, user}:{property_name:string,user:string}) => {
                return {
                    title: `New Maintenance Request`,
                    message: `You have received a new maintenance request for  ${property_name} from ${user}.`,
                    type: 'info'  
                }
            }
        }
    }

    async unreadNotification(user:string){
        const total = await Notification.query().count('id','total').whereRaw('user_id = ? AND read = ?',[user,false])
        return total[0].$extras.total
    }
}