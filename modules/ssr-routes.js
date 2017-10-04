const express = require('express')
const path = require('path')
const LRU = require('lru-cache')
const chalk = require('chalk')
const microcache = require('route-cache')
const compression = require('compression')
const pug = require('pug')
// const passportConfig = require('../config/passport')

const isProd = process.env.NODE_ENV === 'production'

module.exports = function(app) {

  const resolve = file => path.resolve(__dirname, file)

  const { createBundleRenderer } = require('vue-server-renderer')

  // const template = pug.renderFile(resolve('../views/layout.pug'), {title: 'Vue 2.0', messages:[]})
  // const template = fs.readFileSync(resolve('../client/index.template.html'), 'utf-8')

  // const temp = fs.readFileSync(resolve('../view/layout.pug'), 'utf-8')
  // const fn = pug.compile(temp, options)
  // const template = fn() //fn(locals)

  const template = pug.renderFile(resolve('../views/layout.pug'))

  function createRenderer (bundle, options) {
    // https://github.com/vuejs/vue/blob/dev/packages/vue-server-renderer/README.md#why-use-bundlerenderer
    return createBundleRenderer(bundle, Object.assign(options, {
      template,
      // for component caching
      cache: LRU({
        max: 1000,
        maxAge: 1000 * 60 * 15
      }),
      // this is only needed when vue-server-renderer is npm-linked
      basedir: resolve('../dist'),
      // recommended for performance
      runInNewContext: false
    }))
  }

  let renderer
  let readyPromise
  if (isProd) {
    // In production: create server renderer using built server bundle.
    // The server bundle is generated by vue-ssr-webpack-plugin.
    const bundle = require('../dist/vue-ssr-server-bundle.json')
    // The client manifests are optional, but it allows the renderer
    // to automatically infer preload/prefetch links and directly add <script>
    // tags for any async chunks used during render, avoiding waterfall requests.
    const clientManifest = require('../dist/vue-ssr-client-manifest.json')
    renderer = createRenderer(bundle, {
      clientManifest
    })
  } else {
    // In development: setup the dev server with watch and hot-reload,
    // and create a new renderer on bundle / index template update.
    readyPromise = require('../build/setup-dev-server')(app, (bundle, options) => {
      renderer = createRenderer(bundle, options)
    })
  }

  const serve = (path, cache) => express.static(resolve(path), {
    maxAge: cache && isProd ? 1000 * 60 * 60 * 24 * 30 : 0
  })

  // app.use(compression({ threshold: 0 }))
  app.use('/dist', serve('../dist', true))
  app.use('/manifest.json', serve('../manifest.json', true))
  app.use('/service-worker.js', serve('../dist/service-worker.js'))
  // app.use(favicon('./public/logo-48.png'))
  // app.use('/public', serve('./public', true))

  // let bundle
  // let options
  // let readyPromise
  // let renderer
  //
  // if (isProd) {
  //   // In production: create server renderer using built server bundle.
  //   // The server bundle is generated by vue-ssr-webpack-plugin.
  //   bundle = require('../dist/vue-ssr-server-bundle.json')
  //   // The client manifests are optional, but it allows the renderer
  //   // to automatically infer preload/prefetch links and directly add <script>
  //   // tags for any async chunks used during render, avoiding waterfall requests.
  //   const clientManifest = require('../dist/vue-ssr-client-manifest.json')
  //   options = { clientManifest }
  // } else {
  //   // In development: setup the dev server with watch and hot-reload,
  //   // and create a new renderer on bundle / index template update.
  //   readyPromise = require('../build/setup-dev-server')(app, (bu, op) => {
  //     bundle = bu
  //     options = op
  //   })
  // }
  //
  // const cache = LRU({ max: 1000, maxAge: 1000 * 60 * 15 })
  // const basedir = resolve('../dist')
  //
  // function createRenderer(req, res, template) {
  //   renderer = createBundleRenderer(bundle, Object.assign(options, { template, cache,
  //     basedir, // this is only needed when vue-server-renderer is npm-linked
  //     runInNewContext: false // recommended for performance
  //   }))
  //   isProd
  //     ? render(req, res)
  //     : readyPromise.then(() => render(req, res))
  // }

  // 1-second microcache.
  // https://www.nginx.com/blog/benefits-of-microcaching-nginx/
  const useMicroCache = process.env.MICRO_CACHE !== 'false'
  // const microCache = LRU({
  //   max: 100,
  //   maxAge: 1000
  // })

  // since this app has no user-specific content, every page is micro-cacheable.
  // if your app involves user-specific content, you need to implement custom
  // logic to determine whether a request is cacheable based on its url and headers.
  // const isCacheable = req => useMicroCache

  app.use(microcache.cacheSeconds(1, req => useMicroCache && req.originalUrl))
  // app.use(microcache.cacheSeconds(1, () => useMicroCache))

  function render (req, res) {
    const s = Date.now()

    res.setHeader("Content-Type", "text/html")
    // res.setHeader("Server", serverInfo)

    const handleError = err => {
      if (err.url) {
        res.redirect(err.url)
      } else if(err.code === 404) {
        res.status(404).send('404 | Page Not Found')
      } else {
        // Render Error Page or Redirect
        res.status(500).send('500 | Internal Server Error')
        console.error(`error during render : ${req.url}`)
        console.error(err.stack)
      }
    }

    const context = {
      title: 'Cube', // default title
      style: '',
      host: req.headers.host,
      url: req.url,
      user: req.user,
      req: req,
      res: res,
    }

    renderer.renderToString(context, (err, html) => {
      if (err) {
        return handleError(err)
      }
      res.send(html)
      if (!isProd) {
        // console.log(`render whole request: ${Date.now() - s}ms`)
        console.log(chalk.red(`render whole request: ${Date.now() - s}ms`))
      }
    })
  }

  // function render (req, res) {
  //   const s = Date.now()
  //
  //   const handleError = err => {
  //     if (err && err.code === 404) {
  //       res.status(404).send('404 | Page Not Found')
  //     } else {
  //       // Render Error Page or Redirect
  //       res.status(500).send('500 | Internal Server Error')
  //       console.error(`error during render : ${req.url}`)
  //       console.error(err.stack)
  //     }
  //   }
  //
  //   // const cacheable = isCacheable(req)
  //   // if (cacheable) {
  //   //   const hit = microCache.get(req.url)
  //   //   if (hit) {
  //   //     if (!isProd) {
  //   //       console.log(chalk.blue(`cache hit! whole request: ${Date.now() - s}ms`))
  //   //     }
  //   //     return res.send(hit)
  //   //   }
  //   // }
  //
  //   const context = {
  //     title: 'Cube', // default title
  //     style: '',
  //     host: req.headers.host,
  //     url: req.url,
  //     user: req.user,
  //     req: req,
  //     res: res,
  //   }
  //
  //   renderer.renderToString(context, (err, html) => {
  //     if (err) {
  //       return handleError(err)
  //     }
  //     res.send(html)
  //     // if (cacheable) {
  //     //   microCache.set(req.url, html)
  //     // }
  //     if (!isProd) {
  //       console.log(chalk.red(`render whole request: ${Date.now() - s}ms`))
  //     }
  //   })
  // }

  // app.get('/', passportConfig.isAuthenticated, (req, res) => {
  //   res.render('template', {title: 'Home'}, (err, template) => {
  //     createRenderer(req, res, template)
  //   })
  // })
  //
  // app.get('/build/:id?', passportConfig.isAuthenticated, (req, res) => {
  //   res.render('template', {title: 'Build'}, (err, template) => {
  //     createRenderer(req, res, template)
  //   })
  // })
  //
  // app.get('/lab', passportConfig.isAuthenticated, (req, res) => {
  //   res.render('template', {title: 'Lab'}, (err, template) => {
  //     createRenderer(req, res, template)
  //   })
  // })

  // // Serve static assets
  // const serve = (path, cache) => express.static(resolve(path), {
  //   maxAge: cache && isProd ? 1000 * 60 * 60 * 24 * 30 : 0
  // })
  //
  // app.use('/dist', serve('../dist', true))
  // app.use('/manifest.json', serve('../manifest.json', true))
  // app.use('/service-worker.js', serve('../dist/service-worker.js'))


  app.get('*', isProd ? render : (req, res) => {
    readyPromise.then(() => render(req, res))
  })

  // app.get('*', (req, res, next) => {
  //
  //   if (req.url.includes('/dist/')
  //     || req.url.includes('/css/')
  //     || req.url.includes('/favicon.ico')
  //     || req.url.includes('/__webpack_hmr')
  //   ) return next()
  //
  //   log('catch all', req.url)
  //
  //   res.render('template', {title: 'catch all'}, (err, template) => {
  //     createRenderer(req, res, template)
  //   })
  // })
}
