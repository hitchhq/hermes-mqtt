'use strict';

const mqtt = require('mqtt');
const HermesMessage = require('hermesjs-message');

function init (settings) {
  return function (hermes) {
    return new HermesMQTT(settings, hermes);
  };
}

function HermesMQTT (settings, hermes) {
  this.hermes = hermes;
  this.server_settings = settings;
}

HermesMQTT.prototype.listen = function listen () {
  this.client = this.connect();
  this.setup();
  return this.client;
};

HermesMQTT.prototype.connect = function connect () {
  return mqtt.connect(this.server_settings.host_url || 'mqtt://localhost');
};

HermesMQTT.prototype.setup = function setup () {
  this.client.on('connect', () => {
    this.hermes.emit('broker:ready', { name: 'MQTT adapter' });
    this.client.subscribe(this.server_settings.topics || '#', {
      qos: this.server_settings.qos || 0
    });
  });
  this.client.on('message', this.published.bind(this));
};

HermesMQTT.prototype.published = function published (topic, message, packet) {
  this.hermes.emit('broker:message', this.createMessage(packet, this.client));
};

HermesMQTT.prototype.createMessage = function createMessage (packet, client) {
  const message = new HermesMessage({
    topic: packet.topic,
    payload: packet.payload,
    protocol: {
      name: this.server_settings.protocol || 'mqtt',
      headers: {
        cmd: packet.cmd,
        retain: packet.retain,
        qos: packet.qos,
        dup: packet.dup,
        length: packet.length
      }
    },
    connection: client,
    packet
  });

  message.on('send', this.send.bind(this, message));

  return message;
};

HermesMQTT.prototype.send = function send (message) {
  let payload = message.payload;

  if (typeof payload === 'object' && !(payload instanceof Buffer)) {
    try {
      payload = JSON.stringify(payload);
    } catch (e) {
      // Nothing to do here...
    }
  }

  if (!(payload instanceof Buffer) && typeof payload !== 'string') {
    payload = String(payload);
  }

  this.client.publish(message.topic, payload, {
    qos: this.server_settings.qos || 0,
    retain: this.server_settings.retain || false
  });
};

module.exports = init;
