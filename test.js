var test = require('tape');
var Store = require('./index.js');

test('create Store', function (t) {
  var store = Store();
  var state = store.getState();
  t.deepEqual(state, {});
  t.end();
});

test('create Store with initialState', function (t) {
  var initialState = { myThing: true };
  var store = Store(null, initialState);
  var state = store.getState();
  t.deepEqual(state, initialState);
  t.end();
});

test('addReducer', function (t) {
  var store = Store();
  store.addReducer('myComponent', function (state, name, action) {
    return action;
  });
  t.equals(Object.keys(store.reducers).length, 1);
  t.true(store.reducers.myComponent);
  t.end();
});

test('addReducers', function (t) {
  var store = Store();
  store.addReducers({
    'myComponent': function (state, name, action) {
      return action;
    },
    'a.b.c': function (state, name, action) {
      return action;
    }
  });
  t.equals(Object.keys(store.reducers).length, 2);
  t.true(store.reducers.myComponent);
  t.true(store.reducers['a.b.c']);
  t.end();
});

test('create Store with initialState and reducers', function (t) {
  var initialState = { myThing: true };
  var reducers = {
    'myComponent': function (state, name, action) {
      return action;
    },
    'a.b.c': function (state, name, action) {
      return action;
    }
  };
  var store = Store(reducers, initialState);
  var state = store.getState();

  t.deepEqual(state, initialState);
  t.equals(Object.keys(store.reducers).length, 2);
  t.true(store.reducers.myComponent);
  t.true(store.reducers['a.b.c']);
  t.end();
});

test('dispatch action -> calls reducer', function (t) {
  var store = Store({
    'myComponent': function (state, name, action) {
      t.deepEqual(state, {});
      t.deepEqual(name, 'myComponent');
      t.deepEqual(action, {
        here: 'to stay'
      });
      t.end();
      return action;
    }
  });

  store.dispatch('myComponent', {
    here: 'to stay'
  });
});

test('dispatch action -> getState()', function (t) {
  var store = Store({
    'myComponent': function (state, name, action) {
      console.warn('reducer return action', action);
      return action;
    }
  });

  store.dispatch('myComponent', {
    here: 'to stay'
  });

  var state = store.getState();
  t.deepEqual(state, {
    'myComponent': {
      here: 'to stay'
    }
  });
  t.end();

});

