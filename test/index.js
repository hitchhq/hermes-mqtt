const sinon = require('sinon');
const should = require('should');
const HermesMQTT = require('../mqtt');
const EventEmitter = new require('events');

function createInstance (settings, hermes) {
  const _settings = settings || { host_url: 'testing' };
  const init = HermesMQTT(_settings);
  const instance = init(hermes || new EventEmitter());

  return instance;
}

describe('HermesMQTT', () => {
  describe('#init', () => {
    it('returns a function', () => {
      const wrapper = HermesMQTT();
      wrapper.should.be.type('function');
    });

    it('wraps config and hermes, and exposes the methods', () => {
      const settings = { settings: true };
      const hermes = new EventEmitter();
      const mqtt = createInstance(settings, hermes);

      mqtt.hermes.should.be.exactly(hermes);
      mqtt.server_settings.should.be.exactly(settings);
      mqtt.listen.should.be.type('function');
      mqtt.send.should.be.type('function');
      mqtt.setup.should.be.type('function');
      mqtt.published.should.be.type('function');
      mqtt.createMessage.should.be.type('function');
    });
  });

  describe('#listen', () => {
    it('calls connect and setup', () => {
      const instance = createInstance();
      const mock = sinon.mock(instance);
      mock.expects('connect').once();
      mock.expects('setup').once();

      instance.listen();

      mock.verify();
    });
  });

  describe('#setup', () => {
    it('listens on connect and message events', () => {
      const instance = createInstance();
      instance.client = new EventEmitter();
      const mock = sinon.mock(instance.client);
      mock.expects('on').withArgs('connect').once();
      mock.expects('on').withArgs('message').once();

      instance.setup();

      mock.verify();
    });

    it('listens to broker:ready on connect', () => {
      const instance = createInstance();
      instance.client = new EventEmitter();
      instance.hermes = new EventEmitter();
      instance.client.subscribe = () => {};
      instance.hermes.on('broker:ready', (e) => {
        e.name.should.be.exactly('MQTT adapter');
      });

      instance.setup();
      instance.client.emit('connect');
    });

    it('subscribes to topics on connect', () => {
      const settings = { topics: 'testing' };
      const instance = createInstance(settings);
      instance.client = new EventEmitter();
      instance.hermes = new EventEmitter();
      instance.client.subscribe = () => {};
      const mock = sinon.mock(instance.client);
      mock.expects('subscribe').withArgs(settings.topics).once();

      instance.setup();
      instance.client.emit('connect');
      mock.verify();
    });
  });
});
