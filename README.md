# Thoughts/Learnings

I knew the ins and outs of [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore) from the [React Context Selector](https://github.com/tigerabrodi/react-context-selectors) library I built. It's a superpower for building state management libraries.

Maybe I'll write a separate blog post about it.

---

The implementation can be a bit hard to understand at first. Let's start by looking at it from the outside.

```js
export const useStore =
  createStore <
  StoreState >
  ((set) => ({
    // ...
  }))
```

Looking at it from the outside, we pass a callback to `createStore`. This callback takes the `set` function (internal implementation) and returns the initial state as object. The `set` function can be used anywhere throughout the create store implementation to update the entire state. That's why you need to spread the current state to keep other values.

PS. Even if the entire object is a new reference, if you spread in e.g. `todos` without changing it, that will not be a new reference, hence won't trigger a re-render.

You'll also notice that it returns a `useStore` function. This is the hook that components will use to consume the state.

Interestingly, the way `useStore` is being used `useStore((state) => state.todos)`, this means we need to return from `createStore` a function (`useStore()`) that takes a callback with the state as argument and returns the selected state.

So for this entire thing to work, there is quite some internal implementation to go over.

---

Regarding type safety, it's really tricky.

We could infer the default state from the callback. That's possible with `infer` and some TS magic (I actually pair coded with [MapleLeaf](https://github.com/itsMapleLeaf) a bit to see if it's possible)

The problem is if you pass an empty array, do we infer it as `[]` or `Array<any>`?

Ok, you can type cast the array as the user of `createStore` to make it work.

But what about union types?

Imagine you've status as `'loading' | 'success' | 'error' | 'idle'`. If it starts as idle, how do you know all the other possible values?

It's really tricky.

Maybe you could infer and tell users of your library to type cast arrays and union types. But that could quickly get messy.

---

```js
import { useSyncExternalStore } from 'react'

type NewStateFn<TState> = (state: TState) => TState

type SetStateFn<TState> = (
  // Either user passes a callback to get access to current state
  // Or a full new state object
  newState: NewStateFn<TState> | TState
) => void

// This is the function we pass to `createStore` as `(set) => ({ ... })`
// It returns an object
// Need ({ ... }) since an arrow function
type CreateStoreFn<TState> = (setFn: SetStateFn<TState>) => TState

// This is just our internal implementation of the store
// It's honestly not needed (to have store as an object)
// but it makes it much cleaner
type StoreApi<TState> = {
  getState: () => TState
  setState: SetStateFn<TState>
  listeners: Set<() => void>
  subscribe: (listener: () => void) => () => void
}

export function createStore<TState>(createState: CreateStoreFn<TState>) {
  let state: TState

  const storeApi: StoreApi<TState> = {
    getState: () => state,

    setState: (newState) => {
      // If newState is a function, we call it with the current state
      // Else we just use the newState object
      const nextState =
        typeof newState === 'function'
          ? (newState as NewStateFn<TState>)(state)
          : newState

      // Only update and notify if state actually changed
      if (!Object.is(nextState, state)) {
        state = nextState

        // We call all listeners to update the UI
        // HOWEVER, because of the `selector` function beneath
        // We only update the UI if the selector function returns a new value (when it compares to the previous snapshot)
        storeApi.listeners.forEach((listener) => listener())
      }
    },

    listeners: new Set<() => void>(),

    subscribe: (listener) => {
      storeApi.listeners.add(listener)

      // Cleanup function
      // This is what useSyncExternalStore will call when the component unmounts
      return () => storeApi.listeners.delete(listener)
    },
  }

  // Initialize the store with the creator function
  // We know `createState` returns an object
  // For their callback with `set` to work, we need to pass the `setState` function
  // `setState` is the one acting as the `set` function
  state = createState(storeApi.setState)

  // Return the store hook that components will use
  // User selects what they want
  return function useStore<SelectedState>(
    selector: (state: TState) => SelectedState
  ): SelectedState {
    const selectedState = useSyncExternalStore(
      // Subscribe function
      // Called with a listener function
      // Imagine: storeApi.subscribe(listener)
      storeApi.subscribe,
      // Get snapshot
      // We use a selector here
      // A selector is a function that returns a part of the state
      // useSyncExternalStore will compare it to the previous snapshot (which used the same selector)
      () => selector(state),

      // Get server snapshot (same as client, this is fine)
      () => selector(state)
    )

    return selectedState
  }
}
```

<details>
  <summary>🍿 Full code of the example</summary>

---

```js
import { createStore } from './create'

type Todo = {
  id: number
  text: string
  completed: boolean
}

type StoreState = {
  todos: Array<Todo>
  count: number
  addTodo: () => void
  toggleTodo: (id: number) => void
  increment: () => void
}

export const useStore = createStore<StoreState>((set) => ({
  todos: [],
  count: 0,
  addTodo: () =>
    set((state) => ({
      ...state,
      todos: [
        ...state.todos,
        {
          id: Date.now(),
          text: `Todo ${state.todos.length + 1}`,
          completed: false,
        },
      ],
    })),
  toggleTodo: (id) =>
    set((state) => ({
      ...state,
      todos: state.todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ),
    })),
  increment: () =>
    set((state) => ({
      ...state,
      count: state.count + 1,
    })),
}))

```

</details>

# Future thoughts

- Maybe a new lib where actions and state are separated.
- You don't need to be a listener if you only consume an action.
- ...
