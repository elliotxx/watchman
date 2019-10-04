FROM golang:1.12.10 AS build

# 拷贝项目代码
ADD ./api /go/src/api
# 设置工作目录
WORKDIR /go/src/api

# 安装依赖
ENV GO111MODULE=on
ENV GOPROXY=https://mirrors.aliyun.com/goproxy/
RUN go mod tidy
# 编译，生成二进制文件
RUN CGO_ENABLED=1 GOOS=linux GOARCH=amd64 go build -ldflags "-extldflags -static" -o watchman main.go


FROM alpine:3.7 AS run

ENV GIN_MODE="release"
# ENV PORT=8080

# 设置alpine的镜像地址为阿里云的地址
RUN echo "https://mirrors.aliyun.com/alpine/v3.6/main/" > /etc/apk/repositories \
    && apk update \
    && apk add --no-cache bash 

# 拷贝上一层编译后的二进制文件到当前层
COPY --from=build /go/src/api/watchman /usr/bin/watchman
RUN chmod +x /usr/bin/watchman

# 后端服务跑起来
# RUN /usr/bin/watchman

ENTRYPOINT ["watchman"]
