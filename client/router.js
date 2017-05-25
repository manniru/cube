import Vue from 'vue'
import Router from 'vue-router'
import Home from './components/Home'
import Groups from './components/Groups'
import Hello from './components/Hello'
import Item from './components/Item'

Vue.use(Router)

export function createRouter () {
  return new Router({
    mode: 'history',
    routes: [
      { path: '/', name: 'Home', component: Home },
      { path: '/groups/:page(\\d+)?', name: 'Groups', component: Groups },
      { path: '/hello', component: Hello },
      { path: '/item/:id', component: Item }
    ]
  })
}
