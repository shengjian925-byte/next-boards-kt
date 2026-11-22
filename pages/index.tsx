import { useState, useEffect } from 'react';

type Reply = { id: string; name: string; content: string; createdAt: string };
type Post = { id: string; name: string; title: string; content: string; likes?: number; createdAt: string; replies: Reply[] };

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'new' | 'popular' | 'old'>('new');
  const [openForm, setOpenForm] = useState(false);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [likedIds, setLikedIds] = useState<{ [key: string]: boolean }>({});
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

  useEffect(() => {
    load();
    try {
      const saved = localStorage.getItem('anon_liked_posts');
      if (saved) setLikedIds(JSON.parse(saved));
    } catch {}
  }, []);

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
    setOpenForm(false);
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
    setExpanded({ ...expanded, [postId]: true });
    await load();
    setLoading(false);
  };

  const handleLike = async (postId: string) => {
    const already = !!likedIds[postId];
    const nextLiked = { ...likedIds, [postId]: !already };
    setLikedIds(nextLiked);
    try {
      localStorage.setItem('anon_liked_posts', JSON.stringify(nextLiked));
    } catch {}

    const diff = already ? -1 : 1;
    setPosts(posts.map((p) => (p.id === postId ? { ...p, likes: Math.max(0, (p.likes || 0) + diff) } : p)));
    await fetch('/api/anon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: already ? 'unlike' : 'like', postId }),
    });
    await load();
  };

  const q = search.trim().toLowerCase();
  const filtered = posts
    .filter((p) =>
      !q
        ? true
        : p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.replies?.some((r) => r.content.toLowerCase().includes(q) || r.name.toLowerCase().includes(q))
    )
    .sort((a, b) => {
      if (sort === 'popular') {
        const scoreB = (b.replies?.length || 0) + (b.likes || 0);
        const scoreA = (a.replies?.length || 0) + (a.likes || 0);
        return scoreB - scoreA;
      }
      if (sort === 'old') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans">
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-3">
          <h1 className="text-xl font-bold text-white">匿名掲示板</h1>
          <button type="button" onClick={() => setOpenForm(!openForm)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold w-11 h-11 rounded-xl text-2xl flex items-center justify-center shadow">
            {openForm ? '×' : '＋'}
          </button>
        </div>

        <div className="relative mb-3">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="スレッド・返信・名前を検索..." className="w-full bg-zinc-900 border border-zinc-800 text-white px-3 py-2 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500" />
          {search && <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-2 text-gray-400 hover:text-white text-sm">×</button>}
        </div>

        <div className="flex gap-2 mb-4 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button type="button" onClick={() => setSort('new')} className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition ${sort === 'new' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>最新順</button>
          <button type="button" onClick={() => setSort('popular')} className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition ${sort === 'popular' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>人気順</button>
          <button type="button" onClick={() => setSort('old')} className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition ${sort === 'old' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>古い順</button>
        </div>

        {openForm && (
          <form onSubmit={submitPost} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow mb-6 space-y-2">
            <input className="w-full bg-zinc-800 border border-zinc-700 text-white p-2 rounded placeholder-gray-400" placeholder="名前（省略可：名無しさん）" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="w-full bg-zinc-800 border border-zinc-700 text-white p-2 rounded placeholder-gray-400" placeholder="タイトル（省略可）" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea className="w-full bg-zinc-800 border border-zinc-700 text-white p-2 rounded placeholder-gray-400" rows={3} required placeholder="新規スレッドの内容..." value={content} onChange={(e) => setContent(e.target.value)} />
            <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg">{loading ? '送信中...' : '新規スレッドを立てる'}</button>
          </form>
        )}

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-8">一致する投稿がありません</p>
          ) : (
            filtered.map((post, idx) => {
              const isOpen = !!expanded[post.id];
              const replyCount = post.replies?.length || 0;
              return (
                <div key={post.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow">
                  <div className="text-xs text-gray-400 mb-1">
                    <span className="font-bold text-white text-sm">{idx + 1}. {post.title}</span> ／ <span className="text-emerald-400 font-bold">{post.name}</span> ／ {new Date(post.createdAt).toLocaleString('ja-JP')}
                  </div>
                  <div className="whitespace-pre-wrap text-gray-100 mb-3">{post.content}</div>

                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => handleLike(post.id)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition ${likedIds[post.id] ? 'bg-pink-600/20 border-pink-500 text-pink-400' : 'bg-zinc-800 border-zinc-700 text-gray-300 hover:border-pink-500'}`}
                    >
                      ♥ {post.likes || 0}
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpanded({ ...expanded, [post.id]: !isOpen })}
                      className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 border border-zinc-700 text-gray-300 hover:text-white"
                    >
                      {isOpen ? '▲ 返信を閉じる' : `▼ 返信を表示・書く (${replyCount})`}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="mt-3 pl-3 border-l-2 border-zinc-800 space-y-2">
                      {post.replies?.map((r, rIdx) => (
                        <div key={r.id} className="bg-zinc-800/80 p-2 rounded text-sm">
                          <div className="text-xs text-gray-400">
                            <span className="font-bold text-gray-200">≫{rIdx + 1}</span> <span className="text-emerald-400 font-bold">{r.name}</span> ({new Date(r.createdAt).toLocaleString('ja-JP')})
                          </div>
                          <div className="whitespace-pre-wrap text-gray-100 mt-1">{r.content}</div>
                        </div>
                      ))}

                      <div className="flex flex-col gap-1 pt-1">
                        <input className="bg-zinc-800 border border-zinc-700 text-white p-1.5 rounded text-sm placeholder-gray-400" placeholder="名前（省略可）" value={replyName[post.id] || ''} onChange={(e) => setReplyName({ ...replyName, [post.id]: e.target.value })} />
                        <div className="flex gap-1">
                          <input className="bg-zinc-800 border border-zinc-700 text-white p-1.5 rounded text-sm flex-1 placeholder-gray-400" placeholder="返信を書く..." value={replyText[post.id] || ''} onChange={(e) => setReplyText({ ...replyText, [post.id]: e.target.value })} />
                          <button type="button" disabled={loading} onClick={() => submitReply(post.id)} className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm px-3 py-1.5 rounded font-bold">
                            返信
                          </button>
                        </div>
                      </div>
)}

);
})
)}



);
}

