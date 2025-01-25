import { useSyncExternalStore } from 'react'

type NewStateFn<TState> = (state: TState) => TState

type SetStateFn<TState> = (
  // Either user passes inline function to get access to current state
  // Or partial state object right way to update a field directly
  newState: NewStateFn<TState>
) => void

type CreateStoreFn<TState> = (setFn: SetStateFn<TState>) => TState

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
      const nextState =
        typeof newState === 'function' ? newState(state) : newState

      // Only update and notify if state actually changed
      if (!Object.is(nextState, state)) {
        state = nextState

        // We call all listeners to update the UI
        // HOWEVER, because of the `selector` function beneath
        // We only update the UI if the selector function returns a new value
        storeApi.listeners.forEach((listener) => listener())
      }
    },
    listeners: new Set<() => void>(),
    subscribe: (listener) => {
      storeApi.listeners.add(listener)
      return () => storeApi.listeners.delete(listener)
    },
  }

  // Initialize the store with the creator function
  state = createState(storeApi.setState)

  // Return the store hook that components will use
  // User selects what they want
  return function useStore<SelectedState>(
    selector: (state: TState) => SelectedState
  ): SelectedState {
    const selectedState = useSyncExternalStore(
      // Subscribe function
      storeApi.subscribe,
      // Get snapshot
      // We use a selector here
      // A selector is a function that returns a part of the state
      // useSyncExternalStore will compare it to the previous snapshot (which used the same selector)
      () => selector(state),

      // Get server snapshot (same as client for simplicity)
      () => selector(state)
    )

    return selectedState
  }
}
