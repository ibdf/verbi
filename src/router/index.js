import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';
// import Card from '../components/Card.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  // {
  //   path: '/card',
  //   name: 'Card',
  //   component: Card,
  // },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

export default router;
