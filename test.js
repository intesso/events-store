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
    'myComponent': function (state, action) {
      t.deepEqual(state, {});
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
    'myComponent': function (state, action) {
      return action;
    }
  });

  store.dispatch('myComponent', {
    here: 'to stay'
  });

  var state = store.getState();
  t.deepEqual(state, {
    here: 'to stay'
  });
  t.end();

});

test('dispatch namespaced action -> getState() including namespace', function (t) {
  var store = Store({
    'routes.ROUTE': function (state, action) {
      return action;
    }
  });

  store.dispatch('routes.ROUTE', {
    here: 'to stay'
  });

  var state = store.getState();
  t.deepEqual(state, {
    routes: {
      here: 'to stay'
    }
  });

  var nested = store.getState('routes.');
  t.deepEqual(nested, { here: 'to stay' });

  t.end();

});

test('dispatch namespaced action -> getState() including namespace', function (t) {
  var store = Store({
    'routes.HOME': function (state, action) {
      return { url: '/' };
    },
    'routes.LOGIN': function (state, action) {
      return { url: '/login' };
    }
  });

  store.dispatch('routes.HOME');
  t.deepEqual(store.getState('routes.'), { url: '/' });
  store.dispatch('routes.LOGIN');
  t.deepEqual(store.getState('routes.'), { url: '/login' });

  t.end();

});

test('dispatch namespaced action (string) -> getState()', function (t) {
  var store = Store({
    'routes.HOME': function (state, action) {
      return '/';
    },
    'routes.LOGIN': function (state, action) {
      return '/login';
    }
  });

  store.dispatch('routes.HOME');
  t.deepEqual(store.getState(), { routes: '/' });
  store.dispatch('routes.LOGIN');
  t.deepEqual(store.getState(), { routes: '/login' });

  t.end();

});
