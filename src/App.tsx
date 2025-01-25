import { useStore } from './lib/store'

function App() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '400px',
        minHeight: '100vh',
        width: '100vw',
        padding: '60px',
      }}
    >
      <FirstTodos />
      <SecondTodos />
    </div>
  )
}

function FirstTodos() {
  const todos = useStore((state) => state.todos)
  const addTodo = useStore((state) => state.addTodo)
  const toggleTodo = useStore((state) => state.toggleTodo)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <h2>First Todos</h2>
        <button
          onClick={addTodo}
          style={{
            padding: '4px',
            border: '1px solid #000',
            borderRadius: '4px',
          }}
        >
          Add Todo
        </button>
      </div>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            {todo.text}
          </li>
        ))}
      </ul>
    </div>
  )
}

function SecondTodos() {
  const count = useStore((state) => state.count)
  const increment = useStore((state) => state.increment)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        minHeight: '100vh',
      }}
    >
      <h2>Count</h2>
      <p>{count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  )
}

export default App
