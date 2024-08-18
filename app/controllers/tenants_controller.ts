import type { HttpContext } from '@adonisjs/core/http'
import { createTenantalidator } from '#validators/tenant_application'
import FileUploadService from '#services/fileupload_service'
import { inject } from '@adonisjs/core'
import TenantDocument from '#models/tenant_document'
import { sendError, sendSuccess } from '../utils.js'
import PropertyTenant from '#models/property_tenant'
import Property from '#models/property'

@inject()
export default class TenantsController {

    constructor(protected uploadService:FileUploadService){}
    public async sendApplication({request,auth,response}:HttpContext){
        try {
            await request.validateUsing(createTenantalidator)
            const docs:Array<Partial<TenantDocument>> = []
            //Attend to ID files
            const identity_documents = request.files('identity_documents_files')
            const identity_documents_names:string[] = request.input('identity_documents_names')
            //Users must submit all document tags
            if(identity_documents.length !== identity_documents_names.length){
                return sendError(response,{message:'Please provide ID document information,tags and files must match!',code:400})
            }

            //Attend to Bank Documents/Records
            const bank_documents = request.files('bank_statement_files')
            const bank_documents_names:string[] = request.input('bank_statement_names')
            //Users must submit all document tags
            if(bank_documents.length !== bank_documents_names.length){
                return sendError(response,{message:'Please provide Bank stagement information,tags and files must match!',code:400})
            }
            
            if(identity_documents){
                const items = await this.uploadService.uploadFiles(request,'identity_documents_files','tenant-id-documents')
                items.forEach((e,i)=>{
                    docs.push({
                        document_category: 'identity',
                        document_name: identity_documents_names[i],
                        document_type: e.fileType,
                        document_url: e.name
                    })
                })
            }

            if(bank_documents){
                const items = await this.uploadService.uploadFiles(request,'bank_statement_files','tenant-bank-statements')
                items.forEach((e,i)=>{
                    docs.push({
                        document_category: 'bank_statement',
                        document_name: bank_documents_names[i],
                        document_type: e.fileType,
                        document_url: e.name
                    })
                })
            }

            const {
                property_id,dob,fullname,mobile,email,gender,rental_history,employed,total_pets,
                employment_type,job_position,job_salary,company_name,pet_names,pet_types,pet_breeds,
                lease_start_date,lease_term,lease_payment,offering_price,
            } = request.body()
            
            const owner = await Property.query().select(['owner_id']).where('id','=',property_id)

            await PropertyTenant.create({
                property_id,
                dob,
                fullname,
                mobile,
                email,
                gender,
                rental_history,
                employed,
                total_pets,
                employment_type,
                job_position,
                job_salary,
                company_name,pet_names,
                pet_types,
                offering_price,
                applicant_id: auth.use('api').user?.id,
                pet_breeds,
                lease_payment,
                lease_term,
                lease_start_date,
                property_owner_id:owner[0].owner_id
            })
            //TODO:: PROPERTY OWNER NOTIFICATION
            return sendSuccess(response,{message:"Application Submitted", code:200})
        } catch (error) {
            return sendError(response,{message:error.message,code:500})
        }
    }

    public async tenantRequests({request,auth,response}:HttpContext){
        try {
            interface Filter {
                user: 'tenant'|'owner',
                property: string,
                sort: 'recent'|'oldest',
                status: 'in-progress'|'rejected'|'approved',
                search: string,
                page: number,
                perPage:number
            }
            const filter:Filter = (request.qs() as Filter)
            const query = PropertyTenant.query()
            .select('*')
            .preload('propertyInfo',(property)=>property.select(['id','property_title']))
            .preload('applicantInfo',(applicant)=>applicant.select(['id','firstname','lastname','email']))
            if(filter.user === 'owner'){
                query.where('property_owner_id','=',auth.use('api').user?.id!)
            }else{
                query.where('applicant_id','=',auth.use('api').user?.id!)
            }

            if(filter.search){
                query.join('properties','property_tenants.property_id','=','properties.id')
                .where((q)=>q.whereRaw('properties.property_title % ? OR property_tenants.email % ? OR property_tenants.fullname % ?',[...Array(3).fill(filter.search)]))
            }
            if(filter.status){
                query.andWhere('property_tenants.status','=',filter.status)
            }
            if(filter.property){
                query.andWhere('property_id','=',filter.property)
            }

            const order = filter.sort ? filter.sort : 'recent'

            const data = await query.orderBy('property_tenants.created_at',order === 'oldest' ? 'asc' : 'desc')
            .paginate(filter.page ?? 1, filter.perPage ?? 20)

            return sendSuccess(response,{message:'Tenant applications', data:data})

        } catch (error) {
            return sendError(response,{message:error.message,code:500})  
        }
    }

    public async updateApplicationStatus({request,response,auth}:HttpContext){
        try {
            const { tenant_id, status } = request.params()
            if(!/^in-progress|rejected|approved/.test(status)){
                return sendError(response,{message:'Invalid status option', code:400})
            }
            const record = await PropertyTenant.find(tenant_id)
            if(record){
                if(auth.use('api').user?.id !== record.property_owner_id){
                    return sendError(response,{message:'You cannot process this application', code:403})
                }
                record.status = status
                record.approval_date = new Date()
                await record.save()
                //TODO:: APPLICANT NOTIFICATION
                if(record.status === 'approved'){
                    //Generate RENTAL INVOICE FOR THE USER
                }
                return sendSuccess(response,{message:'Application status updated successfully', code:200})
            }else{
                return sendError(response,{message:"Application not found", code:404})
            }
        } catch (error) {
            return sendError(response,{message:error.message,code:500}) 
        }
    }

    public async applicationInfo({request,response}:HttpContext){
        try {
            const { tenant_id } = request.params()
            const result = await PropertyTenant.query()
            .select('*')
            .preload('propertyInfo',(property)=>property.select(['id','property_title']))
            .preload('applicantInfo',(applicant)=>applicant.select(['id','firstname','lastname','email']))
            .preload('documents',(documents)=>documents.select('*'))
            .where('id','=',tenant_id)
            return sendSuccess(response,{message:'Application status updated successfully', data:result})
        } catch (error) {
            return sendError(response,{message:error.message,code:500}) 
        }
    }

    public async tenantListing({request,auth,response}:HttpContext){
        try {
            interface Filter {
                property: string,
                status: 'in-progress'|'rejected'|'approved'|'cancelled',
                search: string,
                page:number,
                perPage:number,
                startDate: Date,
                endDate: Date
            }
            const filter:Filter = request.qs() as Filter

            const property_owner = auth.use('api').user?.id

            const query = PropertyTenant.query()
            .select('*')
            .where('property_owner','=',property_owner!)
            if(filter.status){
                query.andWhere('status','=',filter.status)
            }
            if(filter.search){
                query.andWhere((q)=>q.whereRaw('email % ? OR fullname % ?',[...Array(2).fill(filter.search)]))
            }
            if(filter.startDate){
                query.andWhereBetween('created_at',[filter.startDate,filter.endDate ?? new Date()])
            }
            const tenants = await query.orderBy('created_at','desc').paginate(filter.page ?? 1, filter.perPage ?? 20)
            return sendSuccess(response,{message:'Tenant list', data: tenants})
        } catch (error) {
            return sendError(response,{message:error.message,code:500}) 
        }
    }
}