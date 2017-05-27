import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

const Home = () => import('./components/Home')
const Hello = () => import('./components/Hello')
const Item = () => import('./components/Item')
const Groups = () => import('./components/Groups')
const Likes = () => import('./components/Likes')

export function createRouter () {
  return new Router({
    mode: 'history',
    routes: [
      { path: '/', name: 'Home', component: Home },
      { path: '/hello', component: Hello },
      { path: '/item/:id', component: Item },
      { path: '/groups/:page(\\d+)?', name: 'Groups', component: Groups },
      { path: '/likes/:page(\\d+)?', name: 'Likes', component: Likes }
    ]
  })
}
