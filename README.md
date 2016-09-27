# onestore

> onestore is the one

*... store you need in your application*

**Features**

- it is `redux` and `store-emitter` influenced
- works in the browser and in node.js
- minimal dependencies: `events`, `inherits`.
- small
- fast
- synchronous updates
- configurable update or clone state TODO
- dynamic added reducers
- fluent (chainable) API
- supports namespaces
- supports deep nested object trees
- event bubbling


# motivation

I would like to have a store at hand that is similar to redux that works well with nested components.
- It should allow namespaced listeners
- It should be possible to define Listeners on specific `actions` as well as specific `objects in the tree`.
- It should only deal with the required part of the tree, not the whole state object.
- It should support distributed and dynamic added reducers

> **Note:** onestore is not bulletproof. It is possible for one component to overwrite the state of another component that is further down in the object tree.
>
> Therefore you should only add components at the leaves.

# install

```sh
npm install --save onestore
```

# basic usage

```js
var createStore = require('onestore');
var store = createStore();

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
```

# advanced usage with namespaces

```js

var store = window.store = Store();
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
      console.log('ADD', state, action);
      return state.concat([action]);
    },
    'user.bookmarks.REMOVE': function (state, action) {
      console.log('REMOVE', state, action);
      return state.filter(function (bookmark) {
        return bookmark.name !== action;
      });
    }
  });

store.on('user.bookmark', function (state) {
  console.log('user.bookmarks', state);
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


```

# API

**Glossar**

- fluent API: the functions return `this` (except the getters), which is the store instance in order to chain the function calls.
- reducer: reducer function(state, action) which returns the new `state` based on the previous `state` and the `action type` and/or `action`
- action: can be anything from Object to primitive.
- actionType or reducerName: is the name of the reducer function. when you `dispatch` an action, the reducer function must be `registred`, otherwise a `DoesNotExistError` is thrown.
- bubbling: when dispatching actions with a namespace, an event is emitted for every level up to the root ('*').
  e.g. dispatching the action 'user.bookmarks.REMOVE' emits the following events in this order:

      [ 'user.bookmarks.REMOVE', 'user.bookmarks', 'user', '*' ]

- name: namespace + actionType, where the namespace is optional and can be deeply nested (separated with .).

  the name consists of th the optional namespace and the type of the action.

      [ns1.[ns2.[...nsN.]]]actionType

  The namespace corresponds with the object structure in the store.


# Store(reducers, initialState)

Creates a new Store.

`reducers` and `initialState` are optional. if you want to provide the `initialState`, you also have to provide the `reducers`.

`reducers` must be an `Object` with the name of the reducer as **key** and the reducer function as **value**. Multiple reducers can be proviced.

# methods

###  setInitialState(initialState)

Lets you set the initialState like in the Constructor. It must NOT be called, after an action took place with `dispatch`, otherwise a `NotAllowedError` is thrown.


###  begin(namespace)

**Alias**: `module`, `component`, `ns`

Sets the namespace and returns a new module object with the namespace set, so that you don't have to repeat the namespace, but can define it once per module.
You can jump out of this namespace with `end()`;

When an action is dispatched on the module, the corresponding events are emitted on the module as well as on the store.

> Limitation: module events are only emitted, when the dispatched on the module.
In other words if you dispatch e.g. `store.dispatch('tweet.SEND')` **fn** is not called when defined like this: `store.begin('tweet').on('SEND', **fn**)`

###  end()

Ends the namespace for a component and returns the original `store` object.

###  register(reducers) or (name, reducer)

**Alias**: `add`, `define`, `reducer`, `addReducer`

It lets you register `reducers` in the same way as you can register `reducers` in the Constructor. You can call this function any time.
If the reducer function with the given reducerName already exists, it throws `AlreadyExistsError`.

You can also call the `register` function with `name` as String and a `reducer` function, when you just want to add a single `reducer`.

###  update(reducers) or (name, reducer)

**Alias**: `replaceReducer`

Same as `register`, but does not throw an `AlreadyExistsError` when the `reducer` with the given `name` is already registred.
Instead it throws an `DoesNotExistError`, if it does NOT exist.


###  upsert(reducers) or (name, reducer)

**Alias**: `addOrReplaceReducer`

Same as `register`, but does not throw any Errors (normally :-).

###  dispatch(name, action)

**Alias**: `do`, `act`

Dispatches the `action`. The `name` is the `reducerName` provided when the `reducer` function was `registered`. it must match an already defined reducer function, otherwise a `DoesNotExistError` is thrown.

###  getState(namespace)

**Alias**: `get`

Returns the state, based on the `namespace`. If no `namespace` is provided, the root state object is returned.

###  getPreviousState(namespace)

**Alias**: `previous`, `getPrevious`

Same as `getState`, but returns the previous state, based on the `namespace`. If no `namespace` is provided, the previous root state object is returned.


# events

The events correspond with the node.js [event](https://nodejs.org/api/events.html) API.
The direct use of `emit` is discouraged, because the Store emits events based on the dispatched actions.
Mainly useful are the parts of the API are: `on`, `once` and `removeListener`.

###  on(name, state)

called every time the action is dispatched.

###  once(name, state)

called only the first time, the action is dispatched.

###  removeListener(eventName, listener)

Lets you remove an event listener.


# license

MIT

# related

- [redux](http://redux.js.org/)
- [store-emitter](https://github.com/sethvincent/store-emitter)
