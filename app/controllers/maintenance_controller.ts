import type { HttpContext } from '@adonisjs/core/http'
import { sendError, sendSuccess } from '../utils.js'
import Property from '#models/property'
import MaintenanceRequest from '#models/maintenance_request'
import FileUploadService from '#services/fileupload_service'
import { inject } from '@adonisjs/core'

@inject()
export default class MaintenanceController {

    constructor(protected uploadService:FileUploadService){}

    public async composeRequest({request,response,auth}:HttpContext){
        try {
            const { id, request_title,description, property_id } = request.body()
            const applicant_id = auth.use('api').user
            const owner_id = await Property.query().select(['owner_id']).where('id','=',property_id)
            
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
                return sendSuccess(response,{message:'Maintenance request received'})
            }else{
                return sendError(response,{message:'Invalid owner or applicant id', code:403})
            }
        } catch (error) {
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
                if(property_owner.id !== req.owner_id){
                    return sendError(response,{message:"You are not authorized to perform this operation", code:403})
                }
                req.status = status
                await req.save()
                //TODO:: SEND NOTIFICATIONS
                return sendSuccess(response,{message:"Maintenance requst status updated"})
            }else{
                return sendError(response,{message:"Maintenance request not found", code:404})
            }
        } catch (error) {
            return sendError(response,{message:error.message,error})
        }
    }

    public async deleteRequest({request,response,auth}:HttpContext){
        try {
            const { id } = request.params()
            const initiator = auth.use('api').user
            const req = await MaintenanceRequest.find(id)
            if(req && initiator){
                console.log("owner ",req.owner_id,' AND applicant id ',req.applicant_id," current user ", initiator.id)
                if(initiator.id != req.owner_id || initiator.id != req.applicant_id){
                    return sendError(response,{message:"You are not authorized to perform this operation", code:403})
                }
                for(const image of req.images){
                    try {
                        await this.uploadService.removeFile(image,'maintenance-requests')
                    } catch{/** */}
                }
                await req.delete()
                return sendSuccess(response,{message:"Maintenance requst status updated"})
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