# Supabase 设置指南

## 1. 创建Supabase项目

1. 访问 [Supabase官网](https://supabase.com) 并登录
2. 点击 "New project"
3. 填写项目名称和数据库密码
4. 选择区域（建议选择离您最近的区域）
5. 点击 "Create new project"

## 2. 获取API配置

项目创建完成后，进入项目设置：

1. 在左侧菜单点击 **Settings** → **API**
2. 复制以下信息：
   - **Project URL**: 在 "Project URL" 部分
   - **anon public key**: 在 "Project API keys" 部分的 "anon public" key

## 3. 创建数据库表

在Supabase SQL编辑器中运行以下SQL创建 `photos` 表：

```sql
-- 创建photos表
CREATE TABLE photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 启用Row Level Security (RLS)
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- 创建允许任何人插入和查询的策略
CREATE POLICY "允许任何人插入照片" ON photos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "允许任何人查询照片" ON photos
  FOR SELECT USING (true);

CREATE POLICY "允许任何人删除照片" ON photos
  FOR DELETE USING (true);
```

## 4. 创建Storage Bucket

1. 在左侧菜单点击 **Storage**
2. 点击 "Create a new bucket"
3. 输入名称: `photos`
4. 确保勾选 "Public bucket"（这样图片才能公开访问）
5. 点击 "Create bucket"

## 5. 设置Storage策略

在Storage的 `photos` bucket中，点击 "Policies" 标签页，然后创建以下策略：

```sql
-- 允许任何人上传文件
CREATE POLICY "允许任何人上传文件" ON storage.objects
FOR INSERT TO public
WITH CHECK (bucket_id = 'photos');

-- 允许任何人读取文件
CREATE POLICY "允许任何人读取文件" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'photos');

-- 允许任何人删除文件
CREATE POLICY "允许任何人删除文件" ON storage.objects
FOR DELETE TO public
USING (bucket_id = 'photos');
```

## 6. 配置环境变量

1. 复制 `.env.local.template` 为 `.env.local`：
   ```bash
   cp .env.local.template .env.local
   ```

2. 编辑 `.env.local` 文件，填入您的Supabase配置：
   ```
   VITE_SUPABASE_URL=您的项目URL
   VITE_SUPABASE_ANON_KEY=您的anon public key
   ```

## 7. 测试配置

启动应用后，可以测试Supabase连接是否正常：

```javascript
// 在浏览器控制台中测试
import { supabase } from './services/supabaseService';
console.log('Supabase客户端:', supabase);
```

## 注意事项

1. **安全性**: 使用 `anon public key` 是安全的，因为它只有公开访问权限
2. **存储限制**: Supabase免费版有存储限制，注意监控使用量
3. **文件大小**: 默认上传限制为50MB，如需更大请调整Storage设置
4. **CORS设置**: 确保在Supabase的Authentication → URL Configuration中正确设置CORS

## 故障排除

1. **CORS错误**: 检查Supabase项目的CORS设置
2. **认证错误**: 确认anon key是否正确
3. **存储权限错误**: 检查Storage bucket的public设置和策略
4. **数据库权限错误**: 检查RLS策略是否正确设置