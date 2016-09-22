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
  this._state = typeof initialState !== 'undefined' ? initialState : {};
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
  var currentState = utils.fill(name, this._state);
  var currentParent = utils.nestedParent(name, this._state);
  var nextState = this.reducers[name](currentState, action);
  this.didCallReducer(nextState, action, currentState, currentParent.state, currentParent.key);

  var self = this;
  utils.meltdown(name, this._state).forEach(function (namespace) {
    self.emit(namespace, utils.nested(namespace, self._state));
  });
};

Store.prototype.getState = function getState(name) {
  if (!name) return this._state;
  return utils.nested(name, this._state);
};

Store.prototype.willDispatch = function willDispatch(currentState) {
  this._previousState = currentState;
};

Store.prototype.didCallReducer = function didCallReducer(nextState, action, currentState, currentParentState, currentParentKey) {
  console.log('didCallReducer', [].slice.call(arguments));
  if (typeof currentState === 'object' && typeof nextState === 'object') {
    Object.assign(currentState, nextState);
  } else if (typeof currentParentKey !== 'undefined') {
    currentParentState[currentParentKey] = nextState;
  } else {
    this._state = nextState;
  }
};


inherits(DoesNotExistError, Error);
function DoesNotExistError(message) {
  this.message = message || '';
}

inherits(AlreadyExistsError, Error);
function AlreadyExistsError(message) {
  this.message = message || '';
}
