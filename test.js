var test = require('tape');
var Store = require('./index.js');

// TODOs
// - add failing test with overriding parent Object
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
    t.deepEqual(state, '/');
  });

  store.dispatch('routes.HOME');

  t.end();

});

test('counter', function (t) {
  var store = Store({
    'counter.ADD': function (state, action) {
      return ++state;
    },
    'counter.SUB': function (state, action) {
      return --state;
    }
  }, { counter: 0 });

  t.deepEqual(store.getState(), { counter: 0 });

  var events = 0;
  var states = [1, 2, 3, 2];
  store.on('counter', function (state) {
    t.equal(states[events++], state);
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

test('tweets', function (t) {
  var store = Store();

  store
    .setInitialState([])
    .define({
      'SEND': function (state, action) {
        return [{ message: action }].concat(state);
      },
      'LIKE_LATEST_TWEET': function (state, action) {
        var latest = Object.assign({}, state[0]);
        latest.likes = typeof latest.likes === 'undefined' ? 1 : ++latest.likes;
        state[0] = latest;
        return state;
      }
    });

  t.deepEqual(store.getState(), []);

  var events = 0;
  var tweets = 0;
  var likes = 0;

  store.on('SEND', s => tweets++);
  store.on('LIKE_LATEST_TWEET', s => likes++);
  store.on('*', s => events++);


  store
    .do('SEND', 'my first tweet')
    .do('LIKE_LATEST_TWEET')
    .do('SEND', 'now I\'m a pro')
    .do('LIKE_LATEST_TWEET')
    .do('LIKE_LATEST_TWEET')
    .do('LIKE_LATEST_TWEET');

  var state = store.getState();
  t.equal(events, 6);
  t.equal(tweets, 2);
  t.equal(state.length, 2);
  t.deepEqual(state, [{ message: 'now I\'m a pro', likes: 3 }, { message: 'my first tweet', likes: 1 }]);
  t.end();

});

test('user', function (t) {
  var store = Store();
  store.clearCache();
  var events = 0;

  // login.js
  store
    .define({
      'user.LOGIN': function (state, action) {
        return { userState: action };
      },
      'user.LOGOUT': function (state, action) {
        return { userState: null };
      }
    });

  events = 0;

  store.on('user.LOGIN', function (state) {
    t.deepEqual(state.userState, { name: 'its me' });
    events++;
  });
  store.on('user.LOGOUT', function (state) {
    t.equal(state.userState, null);
    events++;
  });
  store.on('user', function (state) {
    t.true(state);
    events++;
  });
  store.on('*', function (state) {
    t.true(state.user);
    events++;
  });

  store.do('user.LOGIN', { name: 'its me' });
  t.deepEqual(store.getState('user'), { userState: { name: 'its me' } });
  store.do('user.LOGOUT');
  t.deepEqual(store.getState('user'), { userState: null });

  t.equal(events, 6);

  // bookmarks.js
  store
    .define({
      'user.bookmarks.ADD': function (state, action) {
        state = Array.isArray(state) ? state : [];
        return state.concat([action]);
      },
      'user.bookmarks.REMOVE': function (state, action) {
        return state.filter(function (bookmark) {
          return bookmark.name !== action;
        });
      }
    });

  store.on('user.bookmark', function (state) {
    t.true(Array.isArray(state));
    events++;
  });

  events = 0;

  store
    .do('user.bookmarks.ADD', {
      url: 'www.npmjs.org',
      name: 'npm'
    })
    .do('user.bookmarks.ADD', {
      url: 'www.nodejs.org',
      name: 'node.js'
    })
    .do('user.bookmarks.ADD', {
      url: 'www.devdocs.io',
      name: 'devdocs'
    })
    .do('user.bookmarks.REMOVE', 'node.js');

  var state = store.getState('user.bookmarks');
  t.equal(events, 8);
  t.equal(state.length, 2);
  t.deepEqual(state, [
    {
      url: 'www.npmjs.org',
      name: 'npm'
    },
    {
      url: 'www.devdocs.io',
      name: 'devdocs'
    }]);
  t.end();

});
