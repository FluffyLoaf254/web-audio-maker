import { createApp } from 'vue';
import App from './App.vue';
import './style.css';
import { store, key } from './store';

createApp(App).use(store, key).mount('#app');
