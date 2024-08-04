import { test } from '@japa/runner'
import PropertyService from '#services/property_service'
test('Review data', async() => {
  const service = new PropertyService()
  await service.updateRatingandReview('')
})