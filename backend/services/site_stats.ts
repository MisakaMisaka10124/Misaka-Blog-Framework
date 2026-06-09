import fs from 'fs';
import path from 'path';
import type { PostMeta } from '../types';
import { buildIndex, readIndex } from './post_index';
import { getAllTags } from './tag';

const STATS_PATH = () => path.join(__dirname, '../data/config/site_stats.json');

interface SiteStats {
  totalPosts: number;
  totalTags: number;
  todayVisitors: number;
  totalVisitors: number;
  todayDate: string;
  recentPosts: PostMeta[];
}

const RECENT_POSTS_LIMIT = 10;

/** 读取站点统计 */
export function readSiteStats(): SiteStats {
  const filePath = STATS_PATH();
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return { totalPosts: 0, totalTags: 0, todayVisitors: 0, totalVisitors: 0, todayDate: today(), recentPosts: [] };
}

/** 写入站点统计 */
function writeStats(stats: SiteStats) {
  const filePath = STATS_PATH();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(stats, null, 2), 'utf-8');
}

/** 获取今日日期 YYYY-MM-DD */
function today(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * 启动时初始化：从现有数据源构建统计
 */
export function initSiteStats() {
  const visitorStatsPath = path.join(__dirname, '../data/config/visitor_stats.json');

  // 读取文章索引
  let index;
  try {
    index = readIndex();
  } catch {
    index = buildIndex();
  }

  // 读取标签
  let tags: Array<{ tag: string; count: number }> = [];
  try {
    tags = getAllTags();
  } catch {
    // 标签目录可能不存在
  }

  // 读取访客统计
  let todayVisitors = 0;
  let totalVisitors = 0;
  try {
    if (fs.existsSync(visitorStatsPath)) {
      const vs = JSON.parse(fs.readFileSync(visitorStatsPath, 'utf-8'));
      const todayStr = today();
      todayVisitors = vs.daily?.[todayStr] || 0;
      totalVisitors = vs.total || 0;
    }
  } catch {
    // visitor_stats.json 可能不存在
  }

  const dateStr = today();
  const recentPosts = index.posts
    .slice()
    .sort((a: PostMeta, b: PostMeta) => b.date.localeCompare(a.date))
    .slice(0, RECENT_POSTS_LIMIT);

  const stats: SiteStats = {
    totalPosts: index.posts.length,
    totalTags: tags.length,
    todayVisitors,
    totalVisitors,
    todayDate: dateStr,
    recentPosts,
  };

  writeStats(stats);
  return stats;
}

/**
 * 文章变化后更新统计（创建/更新/删除/重建索引）
 * @param recentPostsCount 可选，从 server config 读取的最近文章数
 */
export function updatePostStats(recentPostsCount?: number) {
  const stats = readSiteStats();
  const index = readIndex();
  const limit = recentPostsCount || RECENT_POSTS_LIMIT;

  stats.totalPosts = index.posts.length;
  stats.recentPosts = index.posts
    .slice()
    .sort((a: PostMeta, b: PostMeta) => b.date.localeCompare(a.date))
    .slice(0, limit);

  writeStats(stats);
}

/** 标签变化后更新统计 */
export function updateTagStats() {
  const stats = readSiteStats();

  try {
    const tags = getAllTags();
    stats.totalTags = tags.length;
  } catch {
    // 保持原值
  }

  writeStats(stats);
}

/** 访客记录后更新统计 */
export function updateVisitorStats(todayCount: number, totalCount: number) {
  const stats = readSiteStats();

  // 日期变更时重置今日访客
  const todayStr = today();
  if (stats.todayDate !== todayStr) {
    stats.todayDate = todayStr;
  }

  stats.todayVisitors = todayCount;
  stats.totalVisitors = totalCount;
  writeStats(stats);
}
