import { useState, useEffect } from 'react';
import axios from 'axios';

function Todos() {
  const [todos, setTodos] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/todos?user_id=${user.id}`);
      setTodos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const res = await axios.post('http://localhost:5000/api/todos', {
        user_id: user.id,
        title: newTitle,
        completed: false
      });
      setTodos([...todos, res.data]);
      setNewTitle('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/todos/${id}`, {
        completed: !currentStatus
      });
      setTodos(todos.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/todos/${id}`);
      setTodos(todos.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h1 className="page-title">My Todos</h1>
      
      <form className="add-form" onSubmit={handleAddTodo}>
        <input 
          type="text" 
          value={newTitle} 
          onChange={(e) => setNewTitle(e.target.value)} 
          placeholder="What needs to be done?"
        />
        <button type="submit" className="btn btn-sm">Add Todo</button>
      </form>

      <div className="item-list">
        {todos.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No todos found. Add one above!</div>
        ) : (
          todos.map(todo => (
            <div key={todo.id} className="todo-item">
              <input 
                type="checkbox" 
                checked={todo.completed} 
                onChange={() => handleToggle(todo.id, todo.completed)} 
                style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
              />
              <span className={`todo-title ${todo.completed ? 'todo-completed' : ''}`}>
                {todo.id}: {todo.title}
              </span>
              <div className="actions">
                <button onClick={() => handleDelete(todo.id)} className="btn btn-sm btn-danger">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Todos;
