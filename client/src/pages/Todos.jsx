import { useState, useEffect } from 'react';
import axios from 'axios';

function Todos() {
  const [todos, setTodos] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'completed' | 'active'
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchTodos();
  }, [filter, search, sortOrder]);

  const fetchTodos = async () => {
    try {
      let url = `http://localhost:5000/api/todos?user_id=${user.id}&_sort=id&_order=${sortOrder}`;
      if (filter === 'completed') url += '&completed=true';
      if (filter === 'active') url += '&completed=false';
      if (search.trim()) url += `&title_like=${encodeURIComponent(search)}`;
      const res = await axios.get(url);
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

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search todos..."
          style={{ flex: 1, minWidth: '180px', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="btn btn-sm"
        >
          ID {sortOrder === 'asc' ? '\u2191' : '\u2193'}
        </button>
      </div>

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
