var EventEmitter = require('events');
var inherits = require('inherits');

var utils = require('./utils.js');

/*
Constructing Store
*/
inherits(Store, EventEmitter);
module.exports = Store;
module.exports.createStore = Store;
function Store(reducers, initialState, previous) {
  if (!(this instanceof Store)) return new Store(reducers, initialState, previous);
  this.reducers = {};
  this.did = 0;
  if (reducers) this.register(reducers);
  this.setInitialState(initialState);
}

/*
API functions, also check `events` API, since Store inherits from `events`.
*/
Store.prototype.setInitialState = function setInitialState(initialState) {
  if (this.did) throw new NotAllowedError('not allowed to set initialState after dispatch');
  this._state = typeof initialState !== 'undefined' ? initialState : {};
  return this;
};

Store.prototype.module =
  Store.prototype.component =
  Store.prototype.ns =
  Store.prototype.begin = function begin(ns) {
    var self = this;
    return Object.create(self, {
      namespace: { value: ns },
      _self: { value: self }
    });
  };

Store.prototype.end = function end() {
  if (this._self) return this._self;
  return this;
};

Store.prototype.register =
  Store.prototype.add =
  Store.prototype.define =
  Store.prototype.reducer =
  Store.prototype.addReducer = function addReducers(name, reducer) {
    return this._add(name, reducer, true);
  };

Store.prototype.update =
  Store.prototype.replaceReducer = function replaceReducer(name, reducer) {
    return this._add(name, reducer, true);
  };

Store.prototype.upsert =
  Store.prototype.addOrReplaceReducer = function addOrReplaceReducer(name, reducer) {
    return this._add(name, reducer);
  };

Store.prototype.remove =
  Store.prototype.deregister = function remove(name) {
    return delete this.reducers[this._getName(name)];
  };

Store.prototype.do =
  Store.prototype.act =
  Store.prototype.dispatch = function dispatch(name, action) {
    var n = this._getName(name);
    if (!this.reducers[n]) throw new DoesNotExistError('there is no reducer with the name: ' + n);

    this.willDispatch(this._state, this.did);
    var currentState = utils.fill(n, this._state);
    var currentParent = utils.nestedParent(n, this._state);
    var nextState = this.reducers[n](currentState, action);
    this.didCallReducer(nextState, action, currentState, currentParent.state, currentParent.key);

    var self = this;
    utils.bubble(n, this._state).forEach(function (namespace, i) {
      self.emit(namespace, utils.nested(namespace, self._state, i > 0));
    });
    return this;
  };

Store.prototype.get =
  Store.prototype.getState = function getState(namespace) {
    if (!namespace && !this.namespace) return this._state;
    return utils.nested(this._getName(namespace), this._state, true);
  };

Store.prototype.previous =
  Store.prototype.getPrevious =
  Store.prototype.getPreviousState = function getPreviousState(namespace) {
    if (!namespace) return this._previousState;
    return utils.nested(this._getName(namespace), this._previousState);
  };

Store.prototype.willDispatch = function willDispatch(currentState, did) {
  did++;
  this._previousState = currentState;
};

Store.prototype.didCallReducer = function didCallReducer(nextState, action, currentState, currentParentState, currentParentKey) {
  // TODOs check overwrite parent
  if (typeof currentState === 'object' && typeof nextState === 'object' && !Array.isArray(nextState)) {
    Object.assign(currentState, nextState);
  } else if (typeof currentParentKey !== 'undefined') {
    currentParentState[currentParentKey] = nextState;
  } else {
    this._state = nextState;
  }
};

Store.prototype.clearCache = function clearCache() {
  utils.clearCache();
  return this;
};

/*
Kind of private Stuff
*/
Store.prototype._getName = function _getName(name) {
  return this.namespace ? [this.namespace, name].join('.') : name;
};

Store.prototype._add = function _add(name, reducer, check) {
  if (typeof name === 'string' && !reducer) return this.reducers[name];
  if (typeof name === 'string') return this._addSingle(name, reducer, check);
  var self = this, reducers = name;
  Object.keys(reducers).map(function (key) {
    self._addSingle(key, reducers[key], check);
  });
  return this;
};

Store.prototype._addSingle = function _addSingle(name, reducer, check) {
  var n = this._getName(name);
  if (check === true && this.reducers[n]) throw new AlreadyExistsError('reducer with name: ' + n + ' already exists');
  if (check === false && !this.reducers[n]) throw new DoesNotExistError('there is no reducer with the name: ' + n);
  this.reducers[n] = reducer;
  return this;
};

inherits(DoesNotExistError, Error);
function DoesNotExistError(message) {
  this.message = message || '';
}

inherits(AlreadyExistsError, Error);
function AlreadyExistsError(message) {
  this.message = message || '';
}

inherits(NotAllowedError, Error);
function NotAllowedError(message) {
  this.message = message || '';
}
