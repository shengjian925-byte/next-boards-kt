import { useState, useEffect } from 'react';

type Reply = { id: string; name: string; content: string; image?: string | null; createdAt: string };
type Post = { id: string; name: string; title: string; content: string; image?: string | null; secret?: string | null; likes?: number; createdAt: string; replies: Reply[] };

function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max = 800;
        let w = img.width, h = img.height;
        if (w > max || h > max) {
          if (w > h) { h = Math.round((h * max) / w); w = max; }
          else { w = Math.round((w * max) / h); h = max; }
        }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = (e.target?.result as string) || '';
    };
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'new' | 'popular' | 'old'>('new');
  const [openForm, setOpenForm] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [unlocked, setUnlocked] = useState<{ [key: string]: boolean }>({});
  const [passAttempt, setPassAttempt] = useState<{ [key: string]: string }>({});
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [likedIds, setLikedIds] = useState<{ [key: string]: boolean }>({});
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pic, setPic] = useState('');
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [replyName, setReplyName] = useState<{ [key: string]: string }>({});
  const [replyImg, setReplyImg] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const load = async () => {
    try {
      const res = await fetch('/api/anon');
      const data = await res.json();
      if (Array.isArray(data)) setPosts(data);
    } catch {}
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
    if (!content.trim() && !pic) return;
    if (isPrivate && !secretInput.trim()) return;
    setLoading(true);
    await fetch('/api/anon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        title,
        content,
        image: pic,
        secret: isPrivate ? secretInput.trim() : null,
      }),
    });
    setTitle(''); setContent(''); setPic('');
    setIsPrivate(false); setSecretInput('');
    setOpenForm(false);
    await load();
    setLoading(false);
  };

  const submitReply = async (postId: string) => {
    const text = replyText[postId] || '';
    const img = replyImg[postId] || '';
    if (!text.trim() && !img) return;
    setLoading(true);
    await fetch('/api/anon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, name: replyName[postId], content: text, image: img }),
    });
    setReplyText({ ...replyText, [postId]: '' });
    setReplyImg({ ...replyImg, [postId]: '' });
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
    .filter((p) => {
      if (!q) return true;
      const t = (p.title || '').toLowerCase();
      const n = (p.name || '').toLowerCase();
      if (p.secret && !unlocked[p.id]) return t.includes(q) || n.includes(q);
      const c = (p.content || '').toLowerCase();
      const rHit = Array.isArray(p.replies) && p.replies.some((r) => (r.content || '').toLowerCase().includes(q) || (r.name || '').toLowerCase().includes(q));
      return t.includes(q) || c.includes(q) || n.includes(q) || rHit;
    })
    .sort((a, b) => {
      if (sort === 'popular') {
        const scoreB = (b.replies ? b.replies.length : 0) + (b.likes || 0);
        const scoreA = (a.replies ? a.replies.length : 0) + (a.likes || 0);
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
            <textarea className="w-full bg-zinc-800 border border-zinc-700 text-white p-2 rounded placeholder-gray-400" rows={3} placeholder="新規スレッドの内容..." value={content} onChange={(e) => setContent(e.target.value)} />
            <div className="flex items-center justify-between gap-2 pt-1">
              <label className="bg-zinc-800 border border-zinc-700 text-gray-200 text-xs px-3 py-2 rounded-lg cursor-pointer hover:bg-zinc-700">
                画像を選択
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const list = e.target.files;
                    if (list && list.length > 0) setPic(await compressImage(list.item(0)!));
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition ${isPrivate ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400' : 'bg-zinc-800 border-zinc-700 text-gray-400 hover:text-emerald-400'}`}
              >
                <svg className="w-4 h-4 fill-emerald-400" viewBox="0 0 24 24">
                  <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 5a3 3 0 0 1 6 0v3H9V7z" />
                </svg>
                {isPrivate ? 'プライベートON' : '鍵をかける'}
              </button>
            </div>

            {isPrivate && (
              <input
                type="text"
                required
                placeholder="閲覧用パスワードを設定..."
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                className="w-full bg-emerald-950/30 border border-emerald-600 text-emerald-200 p-2 rounded text-sm placeholder-emerald-600 focus:outline-none"
              />
            )}

            {pic && (
              <div className="flex items-start gap-2">
                <img src={pic} alt="preview" className="max-h-40 rounded border border-zinc-700" />
                <button type="button" onClick={() => setPic('')} className="text-xs text-red-400 hover:underline">削除</button>
              </div>
            )}

            <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg">
              {loading ? '送信中...' : '新規スレッドを立てる'}
            </button>
          </form>
        )}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-8">一致する投稿がありません</p>
          ) : (
            filtered.map((post, idx) => {
              const isLocked = Boolean(post.secret && !unlocked[post.id]);
              const isOpen = !!expanded[post.id];
              const replyCount = Array.isArray(post.replies) ? post.replies.length : 0;

              return (
                <div key={post.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow">
                  <div className="text-xs text-gray-400 mb-1 flex items-center gap-1.5 flex-wrap">
                    {post.secret && (
                      <svg className="w-4 h-4 fill-emerald-400 inline" viewBox="0 0 24 24">
                        <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 5a3 3 0 0 1 6 0v3H9V7z" />
                      </svg>
                    )}
                    <span className="font-bold text-white text-sm">{idx + 1}. {post.title || '無題'}</span>
                    <span>／</span>
                    <span className="text-emerald-400 font-bold">{post.name || '名無しさん'}</span>
                    <span>／ {new Date(post.createdAt).toLocaleString('ja-JP')}</span>
                  </div>

                  {isLocked ? (
                    <div className="mt-2 p-3 bg-zinc-950 border border-emerald-900/60 rounded-lg space-y-2">
                      <p className="text-xs text-emerald-400 font-bold">このスレッドはパスワードで保護されています</p>
                      <div className="flex gap-1.5">
                        <input
                          type="password"
                          placeholder="パスワードを入力..."
                          value={passAttempt[post.id] || ''}
                          onChange={(e) => setPassAttempt({ ...passAttempt, [post.id]: e.target.value })}
                          className="flex-1 bg-zinc-900 border border-zinc-700 text-white px-2.5 py-1.5 rounded text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if ((passAttempt[post.id] || '') === post.secret) {
                              setUnlocked({ ...unlocked, [post.id]: true });
                            } else {
                              alert('パスワードが違います');
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded"
                        >
                          解除
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {post.content && <div className="whitespace-pre-wrap text-gray-100 mb-2">{post.content}</div>}
                      {post.image && <img src={post.image} alt="post" className="max-h-72 rounded-lg mb-3 border border-zinc-800" />}

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
                          {Array.isArray(post.replies) && post.replies.map((r, rIdx) => (
                            <div key={r.id} className="bg-zinc-800/80 p-2 rounded text-sm">
                              <div className="text-xs text-gray-400">
                                <span className="font-bold text-gray-200">≫{rIdx + 1}</span> <span className="text-emerald-400 font-bold">{r.name || '名無しさん'}</span> ({new Date(r.createdAt).toLocaleString('ja-JP')})
                              </div>
                              {r.content && <div className="whitespace-pre-wrap text-gray-100 mt-1">{r.content}</div>}
                              {r.image && <img src={r.image} alt="reply" className="max-h-56 rounded mt-1.5 border border-zinc-700" />}
                            </div>
                          ))}

                          <div className="flex flex-col gap-1.5 pt-1">
                            <input className="bg-zinc-800 border border-zinc-700 text-white p-1.5 rounded text-sm placeholder-gray-400" placeholder="名前（省略可）" value={replyName[post.id] || ''} onChange={(e) => setReplyName({ ...replyName, [post.id]: e.target.value })} />
                            <div className="flex gap-1">
                              <input className="bg-zinc-800 border border-zinc-700 text-white p-1.5 rounded text-sm flex-1 placeholder-gray-400" placeholder="返信を書く..." value={replyText[post.id] || ''} onChange={(e) => setReplyText({ ...replyText, [post.id]: e.target.value })} />
                              <label className="bg-zinc-800 border border-zinc-700 text-gray-200 text-xs px-2.5 py-1.5 rounded flex items-center cursor-pointer hover:bg-zinc-700">
                                画像
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const list = e.target.files;
                                    if (list && list.length > 0) setReplyImg({ ...replyImg, [post.id]: await compressImage(list.item(0)!) });
                                  }}
                                />
                              </label>
                              <button type="button" disabled={loading} onClick={() => submitReply(post.id)} className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm px-3 py-1.5 rounded font-bold">
                                返信
                              </button>
                            </div>
                            {replyImg[post.id] && (
                              <div className="flex items-start gap-2">
                                <img src={replyImg[post.id]} alt="reply preview" className="max-h-32 rounded border border-zinc-700" />
                                <button type="button" onClick={() => setReplyImg({ ...replyImg, [post.id]: '' })} className="text-xs text-red-400 hover:underline">
                                  取消
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
