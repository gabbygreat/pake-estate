import type { HttpContext } from '@adonisjs/core/http'
import { createTenantalidator } from '#validators/tenant_application'
import FileUploadService from '#services/fileupload_service'
import { inject } from '@adonisjs/core'
import TenantDocument from '#models/tenant_document'
import { sendError, sendSuccess } from '../utils.js'
import PropertyTenant from '#models/property_tenant'

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
            })
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
                search: string
            }
        } catch (error) {
            return sendError(response,{message:error.message,code:500})  
        }
    }
}