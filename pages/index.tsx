import { useState, useEffect } from 'react'; type Reply = { id: string; name: string; content: string; createdAt: string }; type Post = { id: string; name: string; title: string; content: string; createdAt: string; replies: Reply[] }; export default function Home() { const [posts, setPosts] = useState([]); const [name, setName] = useState(''); const [title, setTitle] = useState(''); const [content, setContent] = useState(''); const [replyText, setReplyText] = useState({}); const [replyName, setReplyName] = useState({}); const [loading, setLoading] = useState(false); const load = async () => { const res = await fetch('/api/anon'); const data = await res.json(); if (Array.isArray(data)) setPosts(data); }; useEffect(() => { load(); }, []); const submitPost = async (e: React.FormEvent) => { e.preventDefault(); if (!content.trim()) return; setLoading(true); await fetch('/api/anon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, title, content }), }); setTitle(''); setContent(''); await load(); setLoading(false); }; const submitReply = async (postId: string) => { const text = replyText[postId]; if (!text?.trim()) return; setLoading(true); await fetch('/api/anon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, name: replyName[postId], content: text }), }); setReplyText({ ...replyText, [postId]: '' }); await load(); setLoading(false); }; return ( 

匿名掲示板

setName(e.target.value)} /> setTitle(e.target.value)} /> setContent(e.target.value)} /> {loading ? '送信中...' : '新規スレッドを立てる'} 

{posts.map((post, idx) => ( 

{posts.length - idx}: {post.title} ／ {post.name} ／ {new Date(post.createdAt).toLocaleString('ja-JP')} 

{post.content}

{post.replies?.map((r, rIdx) => ( 

≫{rIdx + 1} {r.name} ({new Date(r.createdAt).toLocaleString('ja-JP')}) 

{r.content}

))} 

setReplyName({ ...replyName, [post.id]: e.target.value })} /> 

setReplyText({ ...replyText, [post.id]: e.target.value })} /> submitReply(post.id)} className="bg-gray-800 text-white text-sm px-3 py-1.5 rounded font-bold"> 返信 

))} 

); }        
