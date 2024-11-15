import { test } from '@japa/runner'
import PropertyService from '#services/property_service'
import PropertyReview from '#models/property_review'
import { getMonthStartAndEnd } from '../../../app/utils.js'
test('Review data', async() => {
  const service = new PropertyService()
  await service.updateRatingandReview('')
})

test('review-sum',async()=>{
  const total = await PropertyReview.query().count('id','total')
  console.log(total)
})

test('month-span',()=>{
  console.log(getMonthStartAndEnd('2024-02-01'))
})