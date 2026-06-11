import { useState, useEffect } from 'react';
import axios from 'axios';

function Posts() {
  const [posts, setPosts] = useState([]);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'mine'
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [expandedPost, setExpandedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchPosts();
  }, [viewMode]);

  const fetchPosts = async () => {
    try {
      const url = viewMode === 'mine' 
        ? `http://localhost:5000/api/posts?user_id=${user.id}`
        : 'http://localhost:5000/api/posts';
      const res = await axios.get(url);
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchComments = async (postId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/comments?post_id=${postId}`);
      setComments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;
    try {
      const res = await axios.post('http://localhost:5000/api/posts', {
        user_id: user.id,
        title: newTitle,
        body: newBody
      });
      // Only add to the list if we are viewing 'all' or 'mine'
      setPosts([...posts, res.data]);
      setNewTitle('');
      setNewBody('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/posts/${id}`);
      setPosts(posts.filter(p => p.id !== id));
      if (expandedPost === id) setExpandedPost(null);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComments = (postId) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      fetchComments(postId);
    }
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await axios.post('http://localhost:5000/api/comments', {
        post_id: postId,
        name: user.name,
        email: user.email || `${user.username}@example.com`,
        body: newComment
      });
      setComments([...comments, res.data]);
      setNewComment('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Posts</h1>
        
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface)', padding: '0.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
          <button 
            onClick={() => setViewMode('all')}
            className={`btn btn-sm ${viewMode === 'all' ? '' : 'btn-danger'}`}
            style={{ background: viewMode === 'all' ? 'var(--primary)' : 'transparent', color: viewMode === 'all' ? 'white' : 'var(--text-muted)', boxShadow: 'none' }}
          >
            All Posts
          </button>
          <button 
            onClick={() => setViewMode('mine')}
            className={`btn btn-sm ${viewMode === 'mine' ? '' : 'btn-danger'}`}
            style={{ background: viewMode === 'mine' ? 'var(--primary)' : 'transparent', color: viewMode === 'mine' ? 'white' : 'var(--text-muted)', boxShadow: 'none' }}
          >
            My Posts
          </button>
        </div>
      </div>
      
      <form className="add-form" onSubmit={handleAddPost} style={{ flexDirection: 'column' }}>
        <input 
          type="text" 
          value={newTitle} 
          onChange={(e) => setNewTitle(e.target.value)} 
          placeholder="Write a new post title..."
        />
        <textarea 
          value={newBody} 
          onChange={(e) => setNewBody(e.target.value)} 
          placeholder="What's on your mind?"
          style={{ minHeight: '80px', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }}
        />
        <button type="submit" className="btn btn-sm" style={{ alignSelf: 'flex-start' }}>Publish Post</button>
      </form>

      <div className="item-list">
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No posts found.</div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="item-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ marginBottom: '0.25rem', color: 'var(--primary)' }}>{post.title}</h3>
                  <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '1rem' }}>
                    Post ID: {post.id} {post.user_id === user.id ? '(Yours)' : `(User ID: ${post.user_id})`}
                  </small>
                </div>
                {post.user_id === user.id && (
                  <button onClick={() => handleDeletePost(post.id)} className="btn btn-sm btn-danger">Delete</button>
                )}
              </div>
              <p style={{ color: 'var(--text)', marginBottom: '1rem', lineHeight: '1.6' }}>{post.body}</p>
              
              <button 
                onClick={() => toggleComments(post.id)} 
                className="btn btn-sm" 
                style={{ alignSelf: 'flex-start', background: 'var(--surface-hover)', color: 'var(--primary)', border: '1px solid var(--border)' }}
              >
                {expandedPost === post.id ? 'Hide Comments' : 'Show Comments'}
              </button>

              {expandedPost === post.id && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Comments</h4>
                  {comments.length === 0 ? (
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>No comments yet. Be the first to comment!</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                      {comments.map(c => (
                        <div key={c.id} style={{ background: 'var(--background)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--primary)', display: 'block', marginBottom: '0.25rem' }}>{c.name} ({c.email})</strong>
                          <p style={{ fontSize: '0.95rem', color: 'var(--text)' }}>{c.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <form onSubmit={(e) => handleAddComment(e, post.id)} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      value={newComment} 
                      onChange={(e) => setNewComment(e.target.value)} 
                      placeholder="Write a comment..."
                      style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                    />
                    <button type="submit" className="btn btn-sm">Post Comment</button>
                  </form>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Posts;
