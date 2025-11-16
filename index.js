import { registerRootComponent } from 'expo';
import App from './src/App';

if (__DEV__) {
  console.log('INDEX.JS - ładowanie App:', App);
}

registerRootComponent(App);