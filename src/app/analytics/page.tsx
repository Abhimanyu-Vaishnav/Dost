"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { BarChart3, TrendingUp, Users, Calendar, Filter, Zap, RefreshCw } from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const COLORS = ['var(--color-primary)', '#00ba7c', '#f91880', '#ffd400', '#7856ff', '#ff7a00'];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<string>("all");
  const [timeframe, setTimeframe] = useState<string>("lifetime");
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // Fetch user posts for the dropdown
  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch("/api/users/profile");
        if (res.ok) {
          const data = await res.json();
          // Profile returns posts. We can extract them here.
          // Since we need all posts for the dropdown, we'll fetch them from the dedicated user profile
          if (data.user?.posts) {
             setPosts(data.user.posts);
          } else {
            // Fallback, fetch from our own generic endpoint
            const postsRes = await fetch("/api/posts");
            const postsData = await postsRes.json();
            setPosts(postsData.posts || []);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchPosts();
  }, []);

  // Fetch analytics data based on filters
  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics?timeframe=${timeframe}&postId=${selectedPost}`);
        if (res.ok) {
          const data = await res.json();
          setAnalyticsData(data);
        }
      } catch (e) {
        console.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [timeframe, selectedPost]);

  const handleSeedMockData = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/analytics/seed", { method: "POST" });
      if (res.ok) {
        alert("Mock historical data seeded successfully!");
        window.location.reload();
      } else {
        alert("Failed to seed data. Make sure you have created some posts first.");
      }
    } catch (e) {
      alert("Error seeding data.");
    } finally {
      setIsSeeding(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", padding: "12px", borderRadius: "8px", boxShadow: "var(--shadow-lg)" }}>
          <p style={{ fontWeight: 600, color: "var(--color-text-main)", marginBottom: "4px" }}>{label}</p>
          <p style={{ color: payload[0].color, fontWeight: 700 }}>
            {`${payload[0].name}: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <AppLayout>
      <PageHeader title="Analytics Studio" />
      
      <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        
        {/* Controls Section */}
        <div className="glass animate-slide-up" style={{ padding: "var(--space-4)", borderRadius: "var(--radius-lg)", display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", justifyContent: "space-between" }}>
          
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {/* Post Selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                <Filter size={14} /> View Data For
              </label>
              <select 
                value={selectedPost} 
                onChange={(e) => setSelectedPost(e.target.value)}
                style={{ 
                  padding: "10px 16px", borderRadius: "var(--radius-full)", background: "var(--color-bg-base)", 
                  border: "1px solid var(--color-border)", color: "var(--color-text-main)", outline: "none",
                  cursor: "pointer", fontWeight: 500, minWidth: "200px"
                }}
              >
                <option value="all">Complete Profile (All Posts)</option>
                {posts.map(post => (
                  <option key={post.id} value={post.id}>
                    {post.content.length > 30 ? post.content.substring(0, 30) + "..." : post.content}
                  </option>
                ))}
              </select>
            </div>

            {/* Timeframe Selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                <Calendar size={14} /> Timeframe
              </label>
              <select 
                value={timeframe} 
                onChange={(e) => setTimeframe(e.target.value)}
                style={{ 
                  padding: "10px 16px", borderRadius: "var(--radius-full)", background: "var(--color-bg-base)", 
                  border: "1px solid var(--color-border)", color: "var(--color-text-main)", outline: "none",
                  cursor: "pointer", fontWeight: 500
                }}
              >
                <option value="24h">Last 24 Hours</option>
                <option value="48h">Last 48 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="lifetime">Lifetime</option>
              </select>
            </div>
          </div>

          <button 
            onClick={handleSeedMockData} 
            disabled={isSeeding}
            style={{ 
              padding: "10px 16px", borderRadius: "var(--radius-full)", background: "var(--color-bg-surface)", 
              border: "1px solid var(--color-border)", color: "var(--color-text-muted)", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "0.85rem"
            }}
            className="hover-bg"
          >
            {isSeeding ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />} 
            Generate Mock Data
          </button>

        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "100px", color: "var(--color-primary)" }}>
            <RefreshCw className="animate-spin" size={40} />
          </div>
        ) : !analyticsData || analyticsData.totalViews === 0 ? (
          <div className="glass" style={{ padding: "60px 20px", textAlign: "center", borderRadius: "var(--radius-lg)" }}>
            <BarChart3 size={48} color="var(--color-text-muted)" style={{ margin: "0 auto 16px", opacity: 0.5 }} />
            <h3 className="text-h3" style={{ marginBottom: "8px" }}>Not Enough Data</h3>
            <p className="text-muted">There are no views recorded for this timeframe yet. Try selecting a different timeframe or generating mock data.</p>
          </div>
        ) : (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            
            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <div className="glass" style={{ padding: "20px", borderRadius: "var(--radius-lg)", borderTop: "3px solid var(--color-primary)" }}>
                <div style={{ color: "var(--color-text-muted)", fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                  <TrendingUp size={16} color="var(--color-primary)" /> Total Views
                </div>
                <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--color-text-main)", letterSpacing: "-1px" }}>
                  {analyticsData.totalViews.toLocaleString()}
                </div>
              </div>
              <div className="glass" style={{ padding: "20px", borderRadius: "var(--radius-lg)", borderTop: "3px solid #00ba7c" }}>
                <div style={{ color: "var(--color-text-muted)", fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                  <Users size={16} color="#00ba7c" /> Follower Views
                </div>
                <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--color-text-main)", letterSpacing: "-1px" }}>
                  {analyticsData.demographics.followerStatus.find((x:any) => x.name === "Followers")?.value.toLocaleString() || 0}
                </div>
              </div>
            </div>

            {/* Timeline Chart */}
            <div className="glass" style={{ padding: "24px", borderRadius: "var(--radius-lg)" }}>
              <h3 className="text-h3" style={{ marginBottom: "20px" }}>Views Over Time</h3>
              <div style={{ width: "100%", height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="views" name="Views" stroke="var(--color-primary)" strokeWidth={4} dot={{ r: 4, fill: "var(--color-bg-base)", strokeWidth: 2 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Demographics Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
              
              {/* Audience Type */}
              <div className="glass" style={{ padding: "24px", borderRadius: "var(--radius-lg)" }}>
                <h3 className="text-h3" style={{ marginBottom: "20px", fontSize: "1.2rem" }}>Audience Type</h3>
                <div style={{ width: "100%", height: "250px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={analyticsData.demographics.followerStatus} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        {analyticsData.demographics.followerStatus.map((entry:any, index:number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Devices */}
              <div className="glass" style={{ padding: "24px", borderRadius: "var(--radius-lg)" }}>
                <h3 className="text-h3" style={{ marginBottom: "20px", fontSize: "1.2rem" }}>Devices</h3>
                <div style={{ width: "100%", height: "250px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.demographics.device} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--color-border)" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} width={80} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Views" radius={[0, 4, 4, 0]}>
                        {analyticsData.demographics.device.map((entry:any, index:number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Regions */}
              <div className="glass" style={{ padding: "24px", borderRadius: "var(--radius-lg)", gridColumn: "1 / -1" }}>
                <h3 className="text-h3" style={{ marginBottom: "20px", fontSize: "1.2rem" }}>Top Regions</h3>
                <div style={{ width: "100%", height: "250px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.demographics.region} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Views" radius={[4, 4, 0, 0]}>
                        {analyticsData.demographics.region.map((entry:any, index:number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Genders */}
              <div className="glass" style={{ padding: "24px", borderRadius: "var(--radius-lg)", gridColumn: "1 / -1" }}>
                <h3 className="text-h3" style={{ marginBottom: "20px", fontSize: "1.2rem" }}>Gender Demographics</h3>
                <div style={{ width: "100%", height: "250px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={analyticsData.demographics.gender} innerRadius={0} outerRadius={80} dataKey="value" stroke="var(--color-bg-base)" strokeWidth={2}>
                        {analyticsData.demographics.gender.map((entry:any, index:number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
