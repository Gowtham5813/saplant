import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Plus, MapPin, ImagePlus, Loader2, X, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { z } from "zod";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const postSchema = z.object({
  caption: z.string().trim().max(500, "Caption must be under 500 characters").optional(),
  location: z.string().trim().max(120, "Location must be under 120 characters").optional(),
});

const commentSchema = z.string().trim().min(1, "Comment cannot be empty").max(1000, "Comment too long");

interface ProfileLite {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface CommentRow {
  id: string;
  user_id: string;
  comment: string;
  created_at: string;
  profile?: ProfileLite;
}

interface PostRow {
  id: string;
  user_id: string;
  image_path: string;
  caption: string | null;
  location: string | null;
  created_at: string;
  profile?: ProfileLite;
  image_url: string;
  likes_count: number;
  liked_by_me: boolean;
  comments: CommentRow[];
  comments_count: number;
  showAllComments: boolean;
  newComment: string;
  postingComment: boolean;
}

const getPublicUrl = (path: string) =>
  supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl;

const Posts = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const loadPosts = async () => {
    setLoading(true);
    const { data: rawPosts, error } = await supabase
      .from("posts")
      .select("id, user_id, image_path, caption, location, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      toast.error("Could not load posts");
      setLoading(false);
      return;
    }
    if (!rawPosts || rawPosts.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const postIds = rawPosts.map((p) => p.id);
    const userIds = Array.from(new Set(rawPosts.map((p) => p.user_id)));

    const [{ data: profiles }, { data: likes }, { data: comments }] = await Promise.all([
      supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds),
      supabase.from("post_likes").select("post_id, user_id").in("post_id", postIds),
      supabase
        .from("post_comments")
        .select("id, post_id, user_id, comment, created_at")
        .in("post_id", postIds)
        .order("created_at", { ascending: true }),
    ]);

    const profileMap = new Map<string, ProfileLite>();
    (profiles ?? []).forEach((p) => profileMap.set(p.id, p));

    // Need profiles for commenters too
    const commentUserIds = Array.from(new Set((comments ?? []).map((c) => c.user_id))).filter(
      (id) => !profileMap.has(id),
    );
    if (commentUserIds.length > 0) {
      const { data: extra } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", commentUserIds);
      (extra ?? []).forEach((p) => profileMap.set(p.id, p));
    }

    const likesByPost = new Map<string, { count: number; liked: boolean }>();
    (likes ?? []).forEach((l) => {
      const cur = likesByPost.get(l.post_id) ?? { count: 0, liked: false };
      cur.count += 1;
      if (user && l.user_id === user.id) cur.liked = true;
      likesByPost.set(l.post_id, cur);
    });

    const commentsByPost = new Map<string, CommentRow[]>();
    (comments ?? []).forEach((c) => {
      const arr = commentsByPost.get(c.post_id) ?? [];
      arr.push({ ...c, profile: profileMap.get(c.user_id) });
      commentsByPost.set(c.post_id, arr);
    });

    const enriched: PostRow[] = rawPosts.map((p) => {
      const lk = likesByPost.get(p.id) ?? { count: 0, liked: false };
      const cmts = commentsByPost.get(p.id) ?? [];
      return {
        ...p,
        profile: profileMap.get(p.user_id),
        image_url: getPublicUrl(p.image_path),
        likes_count: lk.count,
        liked_by_me: lk.liked,
        comments: cmts,
        comments_count: cmts.length,
        showAllComments: false,
        newComment: "",
        postingComment: false,
      };
    });

    setPosts(enriched);
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleToggleLike = async (post: PostRow) => {
    if (!user) {
      toast.error("Sign in to like posts");
      return;
    }
    // Optimistic
    const wasLiked = post.liked_by_me;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, liked_by_me: !wasLiked, likes_count: p.likes_count + (wasLiked ? -1 : 1) }
          : p,
      ),
    );

    if (wasLiked) {
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", user.id);
      if (error) {
        toast.error("Could not unlike");
        loadPosts();
      }
    } else {
      const { error } = await supabase
        .from("post_likes")
        .insert({ post_id: post.id, user_id: user.id });
      if (error) {
        // unique violation = already liked, ignore silently
        if (!error.message.toLowerCase().includes("duplicate")) {
          toast.error("Could not like");
          loadPosts();
        }
      }
    }
  };

  const handleAddComment = async (post: PostRow) => {
    if (!user) {
      toast.error("Sign in to comment");
      return;
    }
    const parsed = commentSchema.safeParse(post.newComment);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, postingComment: true } : p)));

    const { data, error } = await supabase
      .from("post_comments")
      .insert({ post_id: post.id, user_id: user.id, comment: parsed.data })
      .select("id, user_id, comment, created_at")
      .single();

    if (error || !data) {
      toast.error("Could not add comment");
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, postingComment: false } : p)));
      return;
    }

    // Fetch profile for the comment (likely already in our profile of self)
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              comments: [...p.comments, { ...data, profile: profile ?? undefined }],
              comments_count: p.comments_count + 1,
              newComment: "",
              postingComment: false,
            }
          : p,
      ),
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 container py-10 md:py-14 max-w-2xl">
        <div className="mb-8 flex items-end justify-between gap-4 animate-fade-up">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-primary-glow font-semibold">Stories from the soil</p>
            <h1 className="mt-2 font-serif text-4xl md:text-5xl">Posts</h1>
            <p className="mt-3 text-muted-foreground">Share photos of your plantings.</p>
          </div>
          {user && (
            <Button variant="forest" size="lg" onClick={() => setCreateOpen(true)} className="shrink-0">
              <Plus /> Create post
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary-glow" />
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-border p-16 text-center">
            <ImagePlus className="h-10 w-10 mx-auto text-primary-glow" />
            <p className="mt-4 text-muted-foreground">No posts yet — share the first one!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.id}
                onToggleLike={() => handleToggleLike(post)}
                onChangeComment={(v) =>
                  setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, newComment: v } : p)))
                }
                onSubmitComment={() => handleAddComment(post)}
                onToggleShowAll={() =>
                  setPosts((prev) =>
                    prev.map((p) => (p.id === post.id ? { ...p, showAllComments: !p.showAllComments } : p)),
                  )
                }
              />
            ))}
          </div>
        )}
      </main>

      <CreatePostDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          setCreateOpen(false);
          loadPosts();
        }}
      />

      <SiteFooter />
    </div>
  );
};

/* ---------- Post Card ---------- */

interface PostCardProps {
  post: PostRow;
  currentUserId?: string;
  onToggleLike: () => void;
  onChangeComment: (v: string) => void;
  onSubmitComment: () => void;
  onToggleShowAll: () => void;
}

const PostCard = ({ post, currentUserId, onToggleLike, onChangeComment, onSubmitComment, onToggleShowAll }: PostCardProps) => {
  const visibleComments = post.showAllComments ? post.comments : post.comments.slice(-2);
  const name = post.profile?.display_name ?? "A planter";

  return (
    <article className="rounded-3xl bg-card border border-border shadow-soft overflow-hidden transition-organic hover:shadow-elevated">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-moss text-primary-foreground font-serif text-lg shrink-0 overflow-hidden">
          {post.profile?.avatar_url ? (
            <img src={post.profile.avatar_url} alt={name} className="h-full w-full object-cover" />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{name}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
            {post.location && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 shrink-0" /> {post.location}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Image */}
      <div className="bg-muted">
        <img
          src={post.image_url}
          alt={post.caption ?? `Planting by ${name}`}
          className="w-full max-h-[640px] object-cover"
          loading="lazy"
        />
      </div>

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onToggleLike}
            className={cn(
              "flex items-center gap-1.5 transition-organic hover:scale-105",
              post.liked_by_me ? "text-destructive" : "text-foreground",
            )}
            aria-label={post.liked_by_me ? "Unlike" : "Like"}
          >
            <Heart className={cn("h-6 w-6", post.liked_by_me && "fill-current")} />
            <span className="text-sm font-semibold">{post.likes_count}</span>
          </button>
          <div className="flex items-center gap-1.5 text-foreground">
            <MessageCircle className="h-6 w-6" />
            <span className="text-sm font-semibold">{post.comments_count}</span>
          </div>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="mt-3 text-sm leading-relaxed">
            <span className="font-semibold mr-2">{name}</span>
            {post.caption}
          </p>
        )}

        {/* Comments */}
        {post.comments.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {!post.showAllComments && post.comments.length > 2 && (
              <button
                type="button"
                onClick={onToggleShowAll}
                className="text-sm text-muted-foreground hover:text-foreground transition-organic"
              >
                View all {post.comments.length} comments
              </button>
            )}
            {visibleComments.map((c) => (
              <p key={c.id} className="text-sm leading-relaxed">
                <span className="font-semibold mr-2">{c.profile?.display_name ?? "Planter"}</span>
                {c.comment}
              </p>
            ))}
            {post.showAllComments && post.comments.length > 2 && (
              <button
                type="button"
                onClick={onToggleShowAll}
                className="text-sm text-muted-foreground hover:text-foreground transition-organic"
              >
                Hide comments
              </button>
            )}
          </div>
        )}

        {/* Add comment */}
        {currentUserId && (
          <form
            className="mt-4 flex items-center gap-2 border-t border-border pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmitComment();
            }}
          >
            <Input
              value={post.newComment}
              onChange={(e) => onChangeComment(e.target.value)}
              placeholder="Add a comment…"
              maxLength={1000}
              className="border-0 focus-visible:ring-0 px-0 shadow-none"
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              disabled={post.postingComment || post.newComment.trim().length === 0}
              aria-label="Post comment"
            >
              {post.postingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        )}
      </div>
    </article>
  );
};

/* ---------- Create Post Dialog ---------- */

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}

const CreatePostDialog = ({ open, onOpenChange, onCreated }: CreatePostDialogProps) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setCaption("");
    setLocation("");
    setSubmitting(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast.error("Only JPG, PNG, WebP, or GIF images allowed");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast.error("Image must be under 5MB");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!file) {
      toast.error("Please choose an image");
      return;
    }

    const parsed = postSchema.safeParse({ caption, location });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      toast.error(uploadError.message || "Image upload failed");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("posts").insert({
      user_id: user.id,
      image_path: path,
      caption: parsed.data.caption || null,
      location: parsed.data.location || null,
    });

    if (insertError) {
      toast.error("Could not create post");
      // Best-effort cleanup
      await supabase.storage.from("post-images").remove([path]);
      setSubmitting(false);
      return;
    }

    toast.success("Post shared 🌱");
    reset();
    onCreated();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!submitting) {
          onOpenChange(v);
          if (!v) reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Create a post</DialogTitle>
          <DialogDescription>Share a photo from your latest planting.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image picker */}
          <div>
            {preview ? (
              <div className="relative rounded-2xl overflow-hidden border border-border">
                <img src={preview} alt="Preview" className="w-full max-h-80 object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-organic"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-full rounded-2xl border-2 border-dashed border-border p-10 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-foreground transition-organic"
              >
                <ImagePlus className="h-8 w-8" />
                <span className="text-sm font-medium">Click to upload an image</span>
                <span className="text-xs">JPG, PNG, WebP or GIF · max 5MB</span>
              </button>
            )}
            <input
              ref={inputRef}
              type="file"
              accept={ALLOWED_TYPES.join(",")}
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* Caption */}
          <div>
            <label className="text-sm font-medium block mb-1.5">Caption</label>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Tell the story behind this planting…"
              maxLength={500}
              rows={3}
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-sm font-medium block mb-1.5">Location</label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bengaluru, India"
              maxLength={120}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onOpenChange(false);
                reset();
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="forest" disabled={submitting || !file}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus />}
              Share post
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default Posts;
