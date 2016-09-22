var EventEmitter = require('events');
var inherits = require('inherits');

var utils = require('./utils.js');

/*
Store Constructor
*/
inherits(Store, EventEmitter);
module.exports = Store;
function Store(reducers, initialState) {
  if (!(this instanceof Store)) return new Store(reducers, initialState);
  this.reducers = {};
  if (reducers) this.addReducers(reducers);
  this._state = initialState || {};
}

/*
API functions, also check `events` API, since Store inherits from `events`.
*/
Store.prototype.addReducers = function addReducers(reducers) {
  var self = this;
  Object.keys(reducers).map(function (key) {
    self.addReducer(key, reducers[key]);
  });
};

Store.prototype.addReducer = function addReducer(name, reducer) {
  if (this.reducers[name]) throw new AlreadyExistsError('reducer with name: ' + name + ' already exists');
  this.addOrReplaceReducer(name, reducer);
};

Store.prototype.replaceReducer = function replaceReducer(name, reducer) {
  if (!this.reducers[name]) throw new DoesNotExistError('there is no reducer with the name: ' + name);
  this.addOrReplaceReducer(name, reducer);
};

Store.prototype.addOrReplaceReducer = function addOrReplaceReducer(name, reducer) {
  this.reducers[name] = reducer;
};

Store.prototype.dispatch = function dispatch(name, action) {
  if (!this.reducers[name]) throw new DoesNotExistError('there is no reducer with the name: ' + name);

  this.willDispatch(this._state);
  var current = utils.fill(name, this._state);
  console.warn('afterWillDispatch', current, this._state);
  var nextState = this.reducers[name](current.state, current.key, action);
  this.didCallReducer(current, nextState, action);

  var self = this;
  utils.meltdown(name, this._state).forEach(function (namespace) {
    self.emit(namespace, utils.nested(namespace, this._state));
  });
};

Store.prototype.getState = function getState(name) {
  if (!name) return this._state;
  return utils.nested(name, this._state);
};

Store.prototype.willDispatch = function willDispatch(currentState) {
  this._previousState = currentState;
};

Store.prototype.didCallReducer = function didCallReducer(current, nextState, action) {
  console.warn('didCallReducer current', current);
  console.warn('didCallReducer nextState', nextState);
  Object.assign(current.state, nextState);
  // current.state[current.key] = nextState;
};


inherits(DoesNotExistError, Error);
function DoesNotExistError(message) {
  this.message = message || '';
}

inherits(AlreadyExistsError, Error);
function AlreadyExistsError(message) {
  this.message = message || '';
}