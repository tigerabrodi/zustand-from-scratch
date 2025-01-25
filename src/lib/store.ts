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
