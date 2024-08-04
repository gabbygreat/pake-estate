import { test } from '@japa/runner'
import PropertyService from '#services/property_service'
test.group('Review data', () => {
  const service = new PropertyService()
  service.updateRatingandReview('')
})