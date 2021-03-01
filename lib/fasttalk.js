'use strict';

let schema = {
  encoder: new TextEncoder(),
  decoder: new TextDecoder(),
  encode: data => {
    return new Uint8Array(schema.encoder.encode(JSON.stringify(data)));
  },
  decode: data => {
    return JSON.parse(schema.decoder.decode(data));
  }
};

let encoder = new TextEncoder();
let decoder = new TextDecoder();

let encode = data => {
  
};