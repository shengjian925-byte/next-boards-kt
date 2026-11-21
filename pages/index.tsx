import { useState, useEffect } from 'react';

type Reply = { id: string; name: string; content: string; createdAt: string };
type Post = { id: string; name: string; title: string; content: string; createdAt: string; replies: Reply[] };

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [replyName, setReplyName] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await fetch('/api/anon');
    const data = await res.json();
    if (Array.isArray(data)) setPosts(data);
  };

  useEffect(() => { load(); }, []);

  const submitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    await fetch('/api/anon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, title, content }),
    });
    setTitle(''); setContent('');
    await load();
    setLoading(false);
  };

  const submitReply = async (postId: string) => {
    const text = replyText[postId];
    if (!text?.trim()) return;
    setLoading(true);
    await fetch('/api/anon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, name: replyName[postId], content: text }),
    });
    setReplyText({ ...replyText, [postId]: '' });
    await load();
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-gray-100 min-h-screen font-sans">
      <h1 className="text-xl font-bold border-b-2 border-gray-800 pb-2 mb-4">匿名掲示板</h1>

      <form onSubmit={submitPost} className="bg-white p-4 rounded shadow mb-6 space-y-2">
        <input className="w-full border p-2 rounded" placeholder="名前（省略可：名無しさん）" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="w-full border p-2 rounded" placeholder="タイトル（省略可）" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="w-full border p-2 rounded" rows={3} required placeholder="新規スレッドの内容..." value={content} onChange={(e) => setContent(e.target.value)} />
        <button disabled={loading} className="w-full bg-blue-600 text-white font-bold py-2 rounded">
          {loading ? '送信中...' : '新規スレッドを立てる'}
        </button>
      </form>

      <div className="space-y-4">
        {posts.map((post, idx) => (
          <div key={post.id} className="bg-white p-4 rounded shadow">
            <div className="text-xs text-gray-500 mb-1">
              <span className="font-bold text-black text-sm">{posts.length - idx}: {post.title}</span> ／ <span className="text-green-700 font-bold">{post.name}</span> ／ {new Date(post.createdAt).toLocaleString('ja-JP')}
            </div>
            <div className="whitespace-pre-wrap text-gray-900 mb-3">{post.content}</div>

            <div className="border-t pt-2 pl-3 space-y-2">
              {post.replies?.map((r, rIdx) => (
                <div key={r.id} className="bg-gray-50 p-2 rounded text-sm">
                  <div className="text-xs text-gray-500">
                    <span className="font-bold text-gray-700">≫{rIdx + 1}</span> <span className="text-green-700 font-bold">{r.name}</span> ({new Date(r.createdAt).toLocaleString('ja-JP')})
                  </div>
                  <div className="whitespace-pre-wrap mt-1">{r.content}</div>
                </div>
              ))}

              <div className="flex flex-col gap-1 pt-1">
                <input className="border p-1.5 rounded text-sm" placeholder="名前（省略可）" value={replyName[post.id] || ''} onChange={(e) => setReplyName({ ...replyName, [post.id]: e.target.value })} />
                <div className="flex gap-1">
                  <input className="border p-1.5 rounded text-sm flex-1" placeholder="返信を書く..." value={replyText[post.id] || ''} onChange={(e) => setReplyText({ ...replyText, [post.id]: e.target.value })} />
                  <button type="button" disabled={loading} onClick={() => submitReply(post.id)} className="bg-gray-800 text-white text-sm px-3 py-1.5 rounded font-bold">
                    返信
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
