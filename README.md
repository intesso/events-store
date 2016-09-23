# events-store

Event Emitter based Store for the browser and node.js

> WIP!!!
> TODO update

## motivation

I would like to have a store at hand that is similar to redux that works well with nested components.
- It should allow namespaced listeners
- It should be possible to define Listeners on specific `actions` as well as specific `objects in the tree`.
- It should only deal with the required part of the tree, not the whole state object.
- It should support distributed and dynamic added reducers

## install

```sh
npm install --save events-store
```

## usage

> // basic example:

```js

// create store
var createStore = require('events-store');
var store = createStore();

// define reducer
store.define('ADD_MY_THING', function (state, action) {
  return state.concat([action.additionalValues]);
});

// dispatch action
store.dispatch('ADD_MY_THING', {
  additionalValues: 'my thing'
});

// get store state (whole object tree)
store.getState();
// -> ['my thing']

// listen on 'MY_THING' event and get new state
store.on('ADD_MY_THING', function(state){
  console.log(state);
});
```


> // NAMESPACE SUPPORT!!!

the name consists of th the optional namespace and the type of the action.

      [ns1.[ns2.[...nsN.]]]actionType

The namespace corresponds with the object structure in the store.

```js
store.addReducer('awesome.spicy', function(state, action) {
  if (action.type === 'SAUCE') {
    Object.assign(state.sauce, action.sauce);
    return state;
  }
});
store.dispatch('awesome.spicy', {
  type: 'SAUCE',
  sauce: {
    water: true,
    cream: true,
    curry: true,
    chili: true
  }
});
// -> state obj: {awesome: {spicy: {sauce: { water: true, cream: true, curry: true, chili: true}}}}

store.addReducer(function(state, action) {
  if (action.type === 'BREAD') {
    Object.assign(state, action.value);
    return state;
  }
});
store.dispatch('awesome.cross', {
  type: 'BREAD',
  value: {
    category: 'zopf',
    tastes: 'great',
  }
});
// -> state obj: {awesome: {cross: {category, 'zopf', tastes: 'great'}}}


```



## license

MIT

## influence

- [redux](http://redux.js.org/)
- [store-emitter](https://github.com/sethvincent/store-emitter)
