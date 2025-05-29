import { ChangeEvent, useEffect, useState } from 'react';
import { supabase } from '../supabase-client';
import { Session } from '@supabase/supabase-js';
import { STORAGE_BUCKETS } from '../constants';
import { TASKS } from '../constants';
import type { Tasks } from '../types/supabase';

function TaskManager({ session }: { session: Session }) {
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [tasks, setTasks] = useState<Tasks[]>([]);
  const [newDescription, setNewDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [taskImage, setTaskImage] = useState<File | null>(null);

  const fetchTasks = async () => {
    const { error, data } = await supabase
      .from(TASKS)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error reading task: ', error.message);
      return;
    }

    setTasks(data);
  };

  const deleteTask = async (id: number) => {
    setError(null);
    const { error } = await supabase.from(TASKS).delete().eq('id', id);

    if (error) {
      setError(error.message);
      console.error('Error deleting task: ', error.message);
      return;
    }
  };

  const updateTask = async (id: number) => {
    setError(null);
    const { error } = await supabase
      .from(TASKS)
      .update({ description: newDescription })
      .eq('id', id);

    if (error) {
      setError(error.message);
      console.error('Error updating task: ', error.message);
      return;
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const filePath = `${file.name}-${Date.now()}`;

    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS)
      .upload(filePath, file);

    if (error) {
      setError(error.message);
      console.error('Error uploading image:', error.message);
      return null;
    }

    const { data } = await supabase.storage
      .from(STORAGE_BUCKETS)
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    let imageUrl: string | null = null;
    if (taskImage) {
      imageUrl = await uploadImage(taskImage);
    }

    const { error } = await supabase
      .from(TASKS)
      .insert({ ...newTask, email: session.user.email!, image_url: imageUrl })
      .select()
      .single();

    if (error) {
      setError(error.message);
      console.error('Error adding task: ', error.message);
      return;
    }

    setNewTask({ title: '', description: '' });
    setTaskImage(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setTaskImage(e.target.files[0]);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    const channel = supabase.channel('tasks-channel');

    // Handle INSERT
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: TASKS },
      (payload) => {
        const newTask = payload.new as Tasks;
        setTasks((prev) => [...prev, newTask]);
      }
    );

    // Handle DELETE
    channel.on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: TASKS },
      (payload) => {
        const deletedTask = payload.old as Tasks;
        setTasks((prev) => prev.filter((task) => task.id !== deletedTask.id));
      }
    );

    // Handle UPDATE
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: TASKS },
      (payload) => {
        const updatedTask = payload.new as Tasks;
        setTasks((prev) =>
          prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
        );
      }
    );

    channel.subscribe((status) => {
      console.info('Subscription status:', status);
    });

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      <h2>Task Manager CRUD</h2>

      {/* Form to add a new task */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
        <input
          type='text'
          placeholder='Task Title'
          value={newTask.title}
          onChange={(e) =>
            setNewTask((prev) => ({ ...prev, title: e.target.value }))
          }
          style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
        />
        <textarea
          placeholder='Task Description'
          value={newTask.description}
          onChange={(e) =>
            setNewTask((prev) => ({ ...prev, description: e.target.value }))
          }
          style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
        />

        <input type='file' accept='image/*' onChange={handleFileChange} />

        <button type='submit' style={{ padding: '0.5rem 1rem' }}>
          Add Task
        </button>
        {error && (
          <div style={{ color: 'red', marginTop: '0.5rem' }}>{error}</div>
        )}
      </form>

      {/* List of Tasks */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {tasks.map((task, key) => (
          <li
            key={key}
            style={{
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '1rem',
              marginBottom: '0.5rem',
            }}
          >
            <div>
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              <img src={task.image_url!} style={{ height: 70 }} />
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                  justifyContent: 'center',
                }}
              >
                <textarea
                  placeholder='Updated description...'
                  onChange={(e) => setNewDescription(e.target.value)}
                />
                <button
                  style={{ padding: '0.5rem 1rem' }}
                  onClick={() => updateTask(task.id)}
                >
                  Edit
                </button>
                <button
                  style={{ padding: '0.5rem 1rem' }}
                  onClick={() => deleteTask(task.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TaskManager;
