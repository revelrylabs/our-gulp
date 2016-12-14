const net = require('net')
console.log(require('rimraf')) // just to make sure i didn't break node_modules resolve
const hello = require('./hello')
const client = '/js/client.js'
hello('./js/client.js')
require('../js/client.js')
