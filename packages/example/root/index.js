import hello from './hello'

import('./hello').then(function(yeah) {
  console.log(yeah.world)
})

console.log('hello', hello)
console.log('hello world! How are you?! Khikhikhi')
