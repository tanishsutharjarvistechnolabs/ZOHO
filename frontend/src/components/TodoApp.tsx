import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CatalystRow,
  APIGetTodos,
  APICreateTodo,
  APIUpdateTodo,
  APIDeleteTodo,
} from '../services/api.service';
import './TodoApp.css';
import { useAuth } from '../store/AuthContext';

type Filter = 'all' | 'active' | 'done';

interface Todo {
  id: string;
  title: string;
  description: string;
  done: boolean;
}

interface CatalystUser {
  email_id?: string;
  first_name?: string;
}

function toTodo(row: CatalystRow): Todo {
  return {
    id: String(row.ROWID),
    title: row.Title,
    description: row.Description ?? '',
    done: row.Completed ?? false,
  };
}

export default function TodoApp() {
  const { user, logout } = useAuth();
  const authenticatedUser = user as CatalystUser | null;
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await APIGetTodos();
      const rows: CatalystRow[] = Array.isArray(data) ? data : (data as any).Todos ?? [];
      setTodos(rows.map(toTodo));
    } catch (e: any) {
      setError(e.message ?? 'Could not load todos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    const title = inputRef.current?.value.trim() ?? '';
    const description = descRef.current?.value.trim() ?? '';
    if (!title) { inputRef.current?.focus(); return; }
    try {
      await APICreateTodo({ title, description });
      if (inputRef.current) inputRef.current.value = '';
      if (descRef.current) descRef.current.value = '';
      await load();
    } catch (e: any) {
      setError(e.message ?? 'Failed to add.');
    }
  };

  const toggle = async (t: Todo) => {
    setTodos(prev => prev.map(x => x.id === t.id ? { ...x, done: !x.done } : x));
    try {
      await APIUpdateTodo(t.id, { completed: !t.done });
    } catch { await load(); }
  };

  const remove = async (id: string) => {
    setTodos(prev => prev.filter(x => x.id !== id));
    try { await APIDeleteTodo(id); }
    catch { await load(); }
  };

  const saveEdit = async (id: string) => {
    const title = editTitle.trim();
    const description = editDesc.trim();
    if (title) {
      setTodos(prev => prev.map(x => x.id === id ? { ...x, title, description } : x));
      try { await APIUpdateTodo(id, { title, description }); }
      catch { await load(); }
    }
    setEditingId(null);
  };

  const visible = todos.filter(t =>
    filter === 'active' ? !t.done : filter === 'done' ? t.done : true
  );
  const remaining = todos.filter(t => !t.done).length;

  return (
    <div className="app">
      <h1>Todo List</h1>
      <div className="user-bar">
        <div className="user-avatar" aria-hidden="true">
          {(authenticatedUser?.first_name ??
            authenticatedUser?.email_id ??
            'C').charAt(0).toUpperCase()}
        </div>
        <div className="user-details">
          <span className="user-label">Signed in as</span>
          <strong className="user-name">
            {authenticatedUser?.email_id ??
              authenticatedUser?.first_name ??
              'Catalyst user'}
          </strong>
        </div>
        <button className="logout-button" type="button" onClick={logout}>
          Sign out
        </button>
      </div>

      <div className="add-form">
        <div className="add-row">
          <input
            ref={inputRef}
            type="text"
            placeholder="Task title *"
            onKeyDown={e => e.key === 'Enter' && add()}
          />
          <button onClick={add}>Add</button>
        </div>
        <input
          ref={descRef}
          type="text"
          className="desc-input"
          placeholder="Description (optional)"
          onKeyDown={e => e.key === 'Enter' && add()}
        />
      </div>

      {error && <p className="error">{error}</p>}

      <div className="filters">
        {(['all', 'active', 'done'] as Filter[]).map(f => (
          <button
            key={f}
            className={filter === f ? 'active' : ''}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="info">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="info">No tasks here.</p>
      ) : (
        <ul className="todo-list">
          {visible.map(todo => (
            <li key={todo.id} className={todo.done ? 'done' : ''}>
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => toggle(todo)}
              />

              {editingId === todo.id ? (
                <div className="edit-wrap">
                  <input
                    className="edit-input"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveEdit(todo.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    placeholder="Title"
                    autoFocus
                  />
                  <input
                    className="edit-input edit-input--desc"
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveEdit(todo.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    placeholder="Description"
                    onBlur={() => saveEdit(todo.id)}
                  />
                </div>
              ) : (
                <div
                  className="todo-content"
                  onDoubleClick={() => {
                    setEditingId(todo.id);
                    setEditTitle(todo.title);
                    setEditDesc(todo.description);
                  }}
                >
                  <span className="title">{todo.title}</span>
                  {todo.description && (
                    <span className="desc">{todo.description}</span>
                  )}
                </div>
              )}

              <button className="del" onClick={() => remove(todo.id)}>✕</button>
            </li>
          ))}
        </ul>
      )}

      <p className="footer">{remaining} task{remaining !== 1 ? 's' : ''} remaining</p>
    </div>
  );
}
