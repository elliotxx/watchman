# 前端构建层，构建前端代码，生成静态文件
FROM node:10 AS build-ui

# 拷贝项目代码
ADD ./ui /root/ui
# 设置工作目录
WORKDIR /root/ui

# 安装依赖
RUN npm config set registry https://registry.npm.taobao.org
RUN npm install
# 构建，生成静态文件
RUN npm run build



# 后端构建层，编译后端代码，生成二进制文件
FROM golang:1.12.10 AS build-api

# 拷贝项目代码
ADD ./api /root/api
# 设置工作目录
WORKDIR /root/api

# 安装依赖
ENV GO111MODULE=on
ENV GOPROXY=https://mirrors.aliyun.com/goproxy/
RUN go mod tidy
# 编译，生成二进制文件
RUN CGO_ENABLED=1 GOOS=linux GOARCH=amd64 go build -ldflags "-extldflags -static" -o cmd/watchman cmd/main.go



# 运行层
FROM alpine:3.7 AS run

ENV GIN_MODE="release"
ENV GIN_PORT=8080

# 安装必要工具，设置 alpine 的镜像地址为阿里云的地址
RUN echo "https://mirrors.aliyun.com/alpine/v3.6/main/" > /etc/apk/repositories \
    && apk update \
    && apk add --no-cache bash \
    && apk add --no-cache nginx && mkdir -p /run/nginx/ \
    && rm -rf /tmp/* /var/cache/apk/*

# 拷贝 nginx 默认配置到容器中
COPY default.conf /etc/nginx/conf.d/default.conf

# 拷贝 build-api 层编译后的二进制文件到当前层
COPY --from=build-api /root/api/cmd/watchman /usr/bin/watchman
RUN chmod +x /usr/bin/watchman

# 拷贝 build-ui 层构建后的静态文件目录到当前层
COPY --from=build-ui /root/ui/build /usr/share/nginx/html
EXPOSE 80

# 指定数据卷和当前运行目录
VOLUME /data
WORKDIR /data

# 拷贝运行脚本，支持后台运行两个进程
COPY run.sh /root/run.sh

# 容器入口，启动容器时运行该命令，且不会被 docker run 提供的命令覆盖
ENTRYPOINT ["/bin/bash","/root/run.sh"]
