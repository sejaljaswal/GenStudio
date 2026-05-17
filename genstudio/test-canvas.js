const fabric = require('fabric');
const c = new fabric.Canvas(null);
const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(c)).filter(k => typeof c[k] === 'function');
console.log(methods.filter(m => m.toLowerCase().includes('back') || m.toLowerCase().includes('send')));
