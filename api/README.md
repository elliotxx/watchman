## 简介
更夫（watchman）是一款可视化定时任务配置工具，集成有Web端交互界面、正则表达式解析、定时任务、邮件提醒、模板定制等功能。

简单来说，更夫是一个Web应用程序，集成有前后端和数据库，可通过 Docker 或者镜像仓库进行一键部署，它的原理是通过在前端配置的定时任务，定时去和数据库中存储的数据对比，如果不一样，代表有更新，发送邮件进行提示，然后更新数据库。

本仓库是 watchman 的后端接口程序

## 依赖
* 语言: golang 1.12+
* web 框架: gin 1.4
* 数据库: sqlite3
* 日志库: glog

使用 go modules 安装依赖
```
go mod tidy
```

## 数据表设计
定时任务
```
name    string  // 任务名称
cron    string  // 定时配置
url     string  // 目标页面 URL
pattern string  // 抓取规则
charset string  // 目标页面编码
content string  // 邮件内容
status  int     // 运行状态, 0代表“运行中”、1代表“暂停”
```

## 笔记
golang 项目创建
```
# export GO111MODULE=on
# go mod init

# 使用 go modules 初始化项目
go mod init watchman-api

# goland 中开启 go modules 支持

# 设置 go modules 阿里云代理
export GOPROXY=https://mirrors.aliyun.com/goproxy/

# 再运行 go get 会自动下载到当前项目目录下，而且使用了国内镜像下载
go get -v github.com/gin-gonic/gin@v1.4
```

## 参考资料
* 用 gin 开发 API 如何解决 cors 问题？  
https://segmentfault.com/q/1010000015287655

* golang中的log库  
https://studygolang.com/articles/14186?fr=sidebar

* GORM 中文文档  
http://gorm.book.jasperxu.com/

* Gin 中文文档  
https://github.com/skyhee/gin-doc-cn