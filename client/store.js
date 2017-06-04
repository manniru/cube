// store.js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

import { fetch, fetchItems, fetchUrl } from './api'

const getActiveItems =  function(page, itemsPerPage, items){
  page = Number(page) || 1
  const start = 0
  const end = page * itemsPerPage
  return items.slice(start, end)
}

export function createStore () {
  return new Vuex.Store({
    state: {
      itemsPerPage: 20,
      groups: [],
      likes: [],
      friends: [],
      feeds: [],
      items: []
    },
    actions: {
      fetchMoreItems ({ state, commit }, {id, offset}) {
        return fetchItems(id, offset, state.itemsPerPage).then(items => {
          commit('addMoreItems', { items })
        })
      },
      fetchItems ({ state, commit }, {id, offset}) {
        return fetchItems(id, offset, state.itemsPerPage).then(items => {
          commit('setItems', { items })
        })
      },
      getGroups ({ state, commit }) {
        if (state.groups.length >0 )
          return Promise.resolve(state.groups)
        return fetch('groups').then(groups => {
          commit('setGroups', { groups })
        })
      },
      getLikes ({ state, commit }) {
        if (state.likes.length >0 )
          return Promise.resolve(state.likes)
        return fetch('likes').then(likes => {
          commit('setLikes', { likes })
        })
      },
      getFriends ({ state, commit }) {
        if (state.friends.length >0 )
          return Promise.resolve(state.friends)
        return fetch('friends').then(friends => {
          commit('setFriends', { friends })
        })
      },
      getFeeds ({ state, commit }) {
        if (state.feeds.length >0 )
          return Promise.resolve(state.feeds)
        return fetch('feeds').then(feeds => {
          commit('setFeeds', { feeds })
        })
      },
    },
    mutations: {
      setGroups (state, { groups }) {
        state.groups = groups
      },
      setLikes (state, { likes }) {
        state.likes = likes
      },
      setFriends (state, { friends }) {
        state.friends = friends
      },
      setFeeds (state, { feeds }) {
        state.feeds = feeds
      },
      setItems (state, { items }) {
        state.items = items
      },
      addMoreItems (state, { items }) {
        state.items = state.items.concat(items)
      },
    },
    getters: {
      activeGroups : (state) => (page) => {
        return getActiveItems(page, state.itemsPerPage, state.groups)
      },

      activeLikes : (state) => (page) => {
        return getActiveItems(page, state.itemsPerPage, state.likes)
      },

      activeFriends : (state) => (page) => {
        return getActiveItems(page, state.itemsPerPage, state.friends)
      },

      activeFeeds (state) {
        let page = state.route.params.page
        return getActiveItems(page, state.itemsPerPage, state.feeds)
      },

      activeItems (state) {
        return state.items
        // let page = state.route.params.page
        // return getActiveItems(page, state.itemsPerPage, state.items)
      }

      // items that should be currently displayed.
      // this Array may not be fully fetched.
      // activeItems (state, getters) {
      //   return getters.activeIds.map(id => state.items[id]).filter(_ => _)
      // }
    }
  })
}
