# 该后端程序默认端口为 8080

# 后端构建层，编译后端代码，生成二进制文件
FROM golang:1.12.10 AS build-api

# 拷贝项目代码
ADD . /root/api
# 设置工作目录
WORKDIR /root/api

# 安装依赖
ENV GO111MODULE=on
ENV GOPROXY=https://mirrors.aliyun.com/goproxy/
RUN go mod tidy
# 编译，生成二进制文件
RUN CGO_ENABLED=1 GOOS=linux GOARCH=amd64 go build -ldflags "-extldflags -static" -o watchman main.go


# 运行层
FROM alpine:3.7 AS run

ENV GIN_MODE="release"
ENV GIN_PORT=8080

# 设置alpine的镜像地址为阿里云的地址
RUN echo "https://mirrors.aliyun.com/alpine/v3.6/main/" > /etc/apk/repositories \
    && apk update \
    && apk add --no-cache bash \
    && rm -rf /tmp/* /var/cache/apk/*

# 拷贝上一层编译后的二进制文件到当前层
COPY --from=build-api /root/api/watchman /usr/bin/watchman
RUN chmod +x /usr/bin/watchman

# 容器入口，启动容器时运行该命令，且不会被 docker run 提供的命令覆盖
ENTRYPOINT ["watchman"]
