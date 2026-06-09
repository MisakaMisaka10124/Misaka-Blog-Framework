# 多阶段构建
# 构建前端
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 运行
FROM node:20-alpine
WORKDIR /app

# 只复制运行需要的文件
COPY package*.json ./
RUN npm ci --production

# 复制后端代码
COPY backend/ ./backend/

# 复制构建好的前端
COPY --from=builder /app/dist/ ./dist/

# 暴露端口（默认3000，可在配置文件中修改）
EXPOSE 3000

# 启动
CMD ["npm", "run", "server"]
