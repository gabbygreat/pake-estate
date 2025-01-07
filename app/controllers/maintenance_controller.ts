/* eslint-disable @typescript-eslint/no-explicit-any */
import type { HttpContext } from '@adonisjs/core/http'
import { sendError, sendSuccess } from '../utils.js'
import Property from '#models/property'
import MaintenanceRequest from '#models/maintenance_request'
import FileUploadService from '#services/fileupload_service'
import { inject } from '@adonisjs/core'
import NotificationService from '#services/notification_service'
import PropertyTenant from '#models/property_tenant'
import Notification from '#models/notification'

interface MaintenanceNotice {
    property_name:string,receiver:string,property_id:string,owner:string
}
@inject()
export default class MaintenanceController {

    constructor(
        protected uploadService:FileUploadService,
        protected notificationService:NotificationService
    ){}

    public async composeRequest({request,response,auth}:HttpContext){
        try {
            const { id, request_title,description, property_id } = request.body()
            const applicant_id = auth.use('api').user
            const owner_id = await Property.query().select(['owner_id','property_title']).where('id','=',property_id)
            //check if this applicant is a member of the property
            const check = await PropertyTenant.query().select(['id']).whereRaw(`
                property_id = ? AND applicant_id = ? AND payment_status = ?`,[property_id,applicant_id?.id,'paid'])
            if(!check[0]){
                return sendError(response,{message:"You are not yet a tenant!", code:403})
            }
            let maintenanceRequest: MaintenanceRequest

            if(applicant_id && owner_id[0]){

                if(id){
                    maintenanceRequest = await MaintenanceRequest.find(id) as MaintenanceRequest
                }else{
                    maintenanceRequest = new MaintenanceRequest()
                }

                maintenanceRequest.request_title = request_title
                maintenanceRequest.description = description
                maintenanceRequest.applicant_id = applicant_id.id
                maintenanceRequest.owner_id = owner_id[0].owner_id
                maintenanceRequest.property_id = property_id

                if(request.files('images')){
                    const images = await this.uploadService.uploadFiles(request,'images','maintenance-requests')
                    const names:string[] = []
                    images.forEach((e)=>names.push(e.name))
                    maintenanceRequest.images = JSON.stringify([
                        ...(maintenanceRequest?.images as string[] ?? []),
                        ...names
                    ]) as any
                }
                await maintenanceRequest.save()
                if(!id){
                    const notificationTemplate = this.notificationService
                    .message()['MAINTENANCE_REQUEST']({
                        property_name: owner_id[0].property_title,
                        user:`${applicant_id.firstname} ${applicant_id.lastname}`
                    })
                    await Notification.create(
                    {
                        user_id:owner_id[0].owner_id,
                        title: notificationTemplate.title,
                        message: notificationTemplate.message,
                        type: notificationTemplate.type,
                        actor_refs: JSON.stringify([applicant_id.id]),
                        entity_ids: JSON.stringify({ property_id: property_id }),
                        slug: 'MAINTENANCE_REQUEST',
                    },
                    )
                }
                return sendSuccess(response,{message:'Maintenance request received'})
            }else{
                return sendError(response,{message:'Invalid owner or applicant id', code:403})
            }
        } catch (error) {
            console.log(error)
            return sendError(response,{message:error.message,error})
        }
    }

    public async updateRequestStatus({request,response,auth}:HttpContext){
        try {
            const property_owner = auth.use('api').user
            const { status, request_id } = request.body()
            if(!/^rejected|ongoing|pending|done/.test(status)){
                return sendError(response,{message:"Invalid status type", code:400})
            }
            const req = await MaintenanceRequest.find(request_id)
            if(req && property_owner){
                const property = await Property.query().select(['id','property_title']).where('id','=',req.property_id)
                if(property_owner.id !== req.owner_id){
                    return sendError(response,{message:"You are not authorized to perform this operation", code:403})
                }
                req.status = status
                await req.save()
                //TODO:: SEND NOTIFICATIONS
                switch(status){
                    case 'rejected':
                        await this.maintenanceRejected({
                            property_id:property[0]?.id,
                            property_name:property[0]?.property_title,
                            owner: property_owner.id,
                            receiver:req.applicant_id
                        })
                        break;
                    case 'ongoing':
                        await this.maintenanceApproved({
                            property_id:property[0]?.id,
                            property_name:property[0]?.property_title,
                            owner: property_owner.id,
                            receiver:req.applicant_id
                        })
                        break;
                    case 'done':
                        await this.maintenanceDone({
                            property_id:property[0]?.id,
                            property_name:property[0]?.property_title,
                            owner: property_owner.id,
                            receiver:req.applicant_id
                        })
                        break;
                    default:
                        break;
                }
                return sendSuccess(response,{message:"Maintenance requst status updated"})
            }else{
                return sendError(response,{message:"Maintenance request not found", code:404})
            }
        } catch (error) {
            return sendError(response,{message:error.message,error})
        }
    }

    async maintenanceDone({property_name,receiver,property_id,owner}:MaintenanceNotice){
        const notificationTemplate = this.notificationService
        .message()['MAINTENANCE_REQUEST_COMPLETED']({
            property_name
        })
        await Notification.create(
        {
            user_id:receiver,
            title: notificationTemplate.title,
            message: notificationTemplate.message,
            type: notificationTemplate.type,
            actor_refs: JSON.stringify([owner]),
            entity_ids: JSON.stringify({ property_id: property_id }),
            slug: 'MAINTENANCE_REQUEST_COMPLETED',
        },
        )
    }

    async maintenanceApproved({property_name,receiver,property_id,owner}:MaintenanceNotice){
        const notificationTemplate = this.notificationService
        .message()['MAINTENANCE_REQUEST_ACCEPTED']({
            property_name
        })
        await Notification.create(
        {
            user_id:receiver,
            title: notificationTemplate.title,
            message: notificationTemplate.message,
            type: notificationTemplate.type,
            actor_refs: JSON.stringify([owner]),
            entity_ids: JSON.stringify({ property_id: property_id }),
            slug: 'MAINTENANCE_REQUEST_ACCEPTED',
        },
        )
    }

    async maintenanceRejected({property_name,receiver,property_id,owner}:MaintenanceNotice){
        const notificationTemplate = this.notificationService
        .message()['MAINTENANCE_REQUEST_REJECTION']({
            property_name
        })
        await Notification.create(
        {
            user_id:receiver,
            title: notificationTemplate.title,
            message: notificationTemplate.message,
            type: notificationTemplate.type,
            actor_refs: JSON.stringify([owner]),
            entity_ids: JSON.stringify({ property_id: property_id }),
            slug: 'MAINTENANCE_REQUEST_REJECTION',
        },
        )
    }

    public async deleteRequest({request,response,auth}:HttpContext){
        try {
            const { id } = request.params()
            const initiator = auth.use('api').user
            const req = await MaintenanceRequest.find(id)
            if(req && initiator){
                if(req.applicant_id == initiator.id || req.owner_id == initiator.id){
                    for(const image of req.images){
                        try {
                            await this.uploadService.removeFile(image,'maintenance-requests')
                        } catch{/** */}
                    }
                    await req.delete()
                    return sendSuccess(response,{message:"Maintenance request deleted"})
                }else{
                    return sendError(response,{message:"You are not authorized to perform this operation", code:403})
                }
            }else{
                return sendError(response,{message:"Maintenance request not found", code:404})
            }
        } catch (error) {
            return sendError(response,{message:error.message,error})
        }
    }

    public async listRequest({request,response,auth}:HttpContext){
        try {
            const user = auth.use('api').user!
            interface Filter {
                owner: boolean|string,
                applicant: boolean|string,
                search: string,
                sort: 'oldest'|'recent'
                status:'rejected'|'ongoing'|'pending'|'done'
                page: number
                perPage: number
            }
            const input:Filter = request.qs() as Filter

            const query = MaintenanceRequest.query().select('*').where('request_title','!=','')
            .preload('applicantInfo',(applicant)=>applicant.select(['id','firstname','lastname','email']))
            .preload('ownerInfo',(owner)=>owner.select(['id','firstname','lastname','email']))
            .preload('propertyInfo',(property)=>property.select(['property_title']))
            
            if(input.owner && (input.owner === 'true' || input.owner === true) ){
                query.andWhere('owner_id','=',user.id)
            }
            if(input.applicant && (input.applicant === true || input.applicant === 'true') ){
                query.andWhere('applicant_id','=',user.id)
            }
            if(input.status && input.status !== 'undefined' as any && input.status !== null && input.status !== undefined){
                if(!/^rejected|ongoing|pending|done/.test(input.status)){
                    return sendError(response,{message:"Invalid status type", code:400})
                }
                query.andWhere('status','=',input.status)
            }
            if(input.search && input.search !== 'undefined' as any && input.search !== null && input.search !== undefined && input.search !=""){
                query.join('properties','maintenance_requests.property_id','properties.id')
                .where((q)=>q.whereRaw(`maintenance_requests.request_title % ? OR properties.property_title % ?`,[Array(2).fill(input.search)]))
                .groupBy(['properties.id','maintenance_requests.id'])
            }
            const data = await query.orderBy('created_at',input.sort === 'oldest' ? 'asc':'desc').paginate(input.page ?? 1, input.perPage ?? 20)

            return sendSuccess(response,{message:'Maintenance requests', data})
        } catch (error) {
            return sendError(response,{message:error.message,error})
        }
    }
}