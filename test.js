var test = require('tape');
var Store = require('./index.js');

// TODO
// - add test with Array
// - add failing test with overriding parent Object
// - replace tests with meaningful examples
// - test remove, update


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

test('register single reducer', function (t) {
  var store = Store.createStore();
  store.register('myComponent', function (state, name, action) {
    return action;
  });
  t.equals(Object.keys(store.reducers).length, 1);
  t.true(store.reducers.myComponent);
  t.end();
});

test('register multiple reducers', function (t) {
  var store = Store();
  store.register({
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
  t.deepEqual(store.getState('routes'), { url: '/' });
  store.dispatch('routes.LOGIN');
  t.deepEqual(store.getState('routes'), { url: '/login' });

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

test('listen .on() bubbling', function (t) {
  var store = Store({
    'routes.HOME': function (state, action) {
      return '/';
    },
    'routes.LOGIN': function (state, action) {
      return '/login';
    }
  });

  var event = 0;
  store.on('routes.HOME', function (state) {
    t.equals(++event, 1);
    t.equals(state, '/');
  });

  store.on('routes', function (state) {
    t.equals(++event, 2);
    t.deepEqual(state, { routes: '/' });
  });

  store.dispatch('routes.HOME');

  t.end();

});

test('counter', function (t) {
  var store = Store({
    'counter.ADD': function (state, action) {
      console.log('ADD', state);
      return ++state;
    },
    'counter.SUB': function (state, action) {
      console.log('SUB', state);
      return --state;
    }
  }, { counter: 0 });

  t.deepEqual(store.getState(), { counter: 0 });

  var events = 0;
  var states = [1, 2, 3, 2];
  store.on('counter', function (state) {
    t.equal(states[events++], state.counter);
  });

  store.dispatch('counter.ADD');
  store.dispatch('counter.ADD');
  store.dispatch('counter.ADD');
  store.dispatch('counter.SUB');

  var counter = store.getState();
  t.equal(counter.counter, 2);
  t.equal(events, 4);
  t.end();

});

test('calc', function (t) {
  var store = Store({
    'ADD': function (state, action) {
      if (isNaN(action)) return ++state;
      return state + action;
    },
    'SUB': function (state, action) {
      if (isNaN(action)) return --state;
      return state - action;
    }
  }, 0);

  t.equal(store.getState(), 0);

  store.on('ADD', ev);
  store.on('SUB', ev);
  store.on('*', ev);

  var events = 0;
  function ev(state) {
    console.log('calc result', state);
    events++;
  }

  store.do('ADD', 5.6);
  store.do('ADD', 7.4);
  store.do('SUB', 3);

  var counter = store.getState();
  t.equal(counter, 10);
  t.equal(events, 6);
  t.end();

});
