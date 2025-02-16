/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

import './routes/user-routes.js'
import './routes/property-route.js'
import './routes/tenant-route.js'
import './routes/maintenance_routes.js'
import './routes/chat-messages-routes.js'
import './routes/wallet-routes.js'
import './routes/currencies-routes.js'
import './routes/rental-invoices-routes.js'
import './routes/analytic-routes.js'
import './routes/admin-routes.js'
import './routes/home-pages-routes.js'
import './routes/about-pages.js'

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

import { sep, normalize } from 'node:path'
import app from '@adonisjs/core/services/app'

const PATH_TRAVERSAL_REGEX = /(?:^|[\\/])\.\.(?:[\\/]|$)/

router.get('/uploads/*', ({ request, response }) => {
  const filePath = request.param('*').join(sep)
  const normalizedPath = normalize(filePath)
  
  if (PATH_TRAVERSAL_REGEX.test(normalizedPath)) {
    return response.badRequest('Malformed path')
  }

  const absolutePath = app.makePath('../', normalizedPath)
  return response.download(absolutePath)
})
