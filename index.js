var EventEmitter = require('events');
var inherits = require('inherits');

var utils = require('./utils.js');

/*
Constructing Store
*/
inherits(Store, EventEmitter);
module.exports = Store;
module.exports.createStore = Store;
function Store(reducers, initialState) {
  if (!(this instanceof Store)) return new Store(reducers, initialState);
  this.reducers = {};
  if (reducers) this.register(reducers);
  this._state = typeof initialState !== 'undefined' ? initialState : {};
}

/*
API functions, also check `events` API, since Store inherits from `events`.
*/
Store.prototype.register =
  Store.prototype.add =
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
    return delete this.reducers[name];
  };

Store.prototype.do =
  Store.prototype.act =
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
    return this;
  };

Store.prototype.get =
  Store.prototype.getState = function getState(name) {
    if (!name) return this._state;
    name = endsWith(name, '.') ? name : name + '.';
    return utils.nested(name, this._state);
  };

Store.prototype.previous =
  Store.prototype.getPrevious =
  Store.prototype.getPreviousState = function getPreviousState(name) {
    if (!name) return this._previousState;
    name = endsWith(name, '.') ? name : name + '.';
    return utils.nested(name, this._previousState);
  };

Store.prototype.willDispatch = function willDispatch(currentState) {
  this._previousState = currentState;
};

Store.prototype.didCallReducer = function didCallReducer(nextState, action, currentState, currentParentState, currentParentKey) {
  // TODO check overwrite parent
  console.log('didCallReducer', [].slice.call(arguments));
  if (typeof currentState === 'object' && typeof nextState === 'object') {
    Object.assign(currentState, nextState);
  } else if (typeof currentParentKey !== 'undefined') {
    currentParentState[currentParentKey] = nextState;
  } else {
    this._state = nextState;
  }
};

/*
Kind of private Stuff
*/
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
  if (check === true && this.reducers[name]) throw new AlreadyExistsError('reducer with name: ' + name + ' already exists');
  if (check === false && !this.reducers[name]) throw new DoesNotExistError('there is no reducer with the name: ' + name);
  this.reducers[name] = reducer;
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

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
