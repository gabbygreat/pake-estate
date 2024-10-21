import { test } from '@japa/runner'
import EmailService,{WelcomeEmail} from '#services/email_service'
import PropertyTenant from '#models/property_tenant'
// test.group('User send email', () => {
//   test('example test', async ({ assert }) => {
//   })
// })
test('send-email',async()=>{
  const emS = new EmailService()
  await emS.setTemplate<WelcomeEmail>('welcome_email',{firstname:'Success'}).sendMail({
    subject:'Welcome onboard!',
    from:'Pake Estate',
    to:'eddyiyke3@gmail.com'
  })
})

test('test-1',async()=>{
  const mainFee = await PropertyTenant.query()
            .select(['id','offering_price','discount_price']).where('id','=','e95a828a-141f-487b-a154-858d657a9994')
            .preload('applicableFees',(fees)=>{
                fees.select(['id','fee_discount','fee_id','property_id'])
                .preload('feeInfo',(info)=>{
                    info.select(['amount','name'])
                })
            })
  const fees:Array<{slug:string,name:string,amount:number,discount:number,id:string|null}> = []
  fees[0] = {
    slug: 'RENTAL_FEE',name:"rent fee",amount:mainFee[0].offering_price,discount:mainFee[0].discount_price,id:null
  }
  mainFee[0].applicableFees.forEach((e)=>{
    fees.push({
      slug:"OTHERS",
      name: e.feeInfo.name,
      amount: e.feeInfo.amount,
      discount: e.fee_discount,
      id: e.id
    })
  })
  console.log(fees)
})