import { test } from '@japa/runner'
import PropertyService from '#services/property_service'
import PropertyReview from '#models/property_review'
test('Review data', async() => {
  const service = new PropertyService()
  await service.updateRatingandReview('')
})

test('review-sum',async()=>{
  const total = await PropertyReview.query().count('id','total')
  console.log(total)
})