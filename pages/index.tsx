import { useState, useEffect } from 'react';

type Post = {
  id: string;
  name: string;
  title: string;
  content: string;
  createdAt: string;
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/anon');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPosts(data);
      } else {
        setErrorMsg(data.details || 'データの読み込みに失敗しました');
      }
    } catch (e) {
      setErrorMsg('通信エラーが発生しました');
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/anon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, title, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.details || data.error || '投稿に失敗しました');
      } else {
        setTitle('');
        setContent('');
        await fetchPosts();
      }
    } catch (e) {
      setErrorMsg('送信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '16px', fontFamily: 'sans-serif', backgroundColor: '#f4f5f7', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 'bold', borderBottom: '2px solid #333', paddingBottom: '8px', marginBottom: '16px' }}>
        匿名掲示板
      </h1>

      {errorMsg && (
        <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '6px', marginBottom: '12px', fontSize: '13px' }}>
          エラー: {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="名前（省略可：名無しさん）"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="タイトル（省略可）"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <textarea
            placeholder="書き込む内容を入力..."
            rows={4}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
        >
          {loading ? '送信中...' : '書き込む'}
        </button>
      </form>

      <div>
        {posts.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>まだ投稿がありません。最初の書き込みをしてみよう！</p>
        ) : (
          posts.map((post, idx) => (
            <div key={post.id} style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '8px', marginBottom: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '13px', color: '#555', marginBottom: '6px' }}>
                <span style={{ fontWeight: 'bold', color: '#111' }}>{posts.length - idx}: {post.title}</span>
                {' '}／ 名前: <span style={{ color: '#059669', fontWeight: 'bold' }}>{post.name}</span>
                {' '}／ {new Date(post.createdAt).toLocaleString('ja-JP')}
              </div>
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '15px', lineHeight: '1.5', color: '#222' }}>
                {post.content}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
