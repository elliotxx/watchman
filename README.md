## 简介
更夫（watchman）是一款可视化定时任务配置工具，集成有Web端交互界面、正则表达式解析、定时任务、邮件提醒、模板定制等功能。

简单来说，更夫是一个Web应用程序，集成有前后端和数据库，可通过 Docker 或者镜像仓库进行一键部署，它的原理是通过在前端配置的定时任务，定时去和数据库中存储的数据对比，如果不一样，代表有更新，发送邮件进行提示，然后更新数据库。

采用同一个仓库管理代码，前后端分离部署的方案

## 依赖
* 前端: React（AntDesign）
* 后端: golang 1.12+
* web 框架: gin 1.4
* 数据库: sqlite3

## 安装
使用 go modules 安装后端依赖
```
cd api
go mod tidy
```
使用 npm 安装前端依赖
```
cd ui
npm install
```

## 功能
- [ ] 定时任务
    - [ ] 定时执行
    - [x] 开始/暂停按钮
- [ ] 对比目标抓取方式
    - [ ] 正则表达式
    - [ ] lxml
- [ ] 邮件提醒
- [ ] 配置邮件账号和密码
- [ ] 抓取模板定制

## 笔记
## docker 镜像加速
鉴于国内网络问题，后续拉取 Docker 镜像十分缓慢，我们可以需要配置加速器来解决，网易的镜像地址：http://hub-mirror.c.163.com。

配置以下文件，设置 docker 镜像仓库代理：
```
# linux
vi /etc/docker/daemon.json（Linux）
# windows
%programdata%\docker\config\daemon.json
# mac
~/.docker/daemon.json
```

请在该配置文件中加入（没有该文件的话，请先建一个）：
```
{
  "registry-mirrors": ["http://hub-mirror.c.163.com"]
}
```

## 采坑
### go-sqlite3 需要在编译时开启 cgo 才能工作
否则报错：Binary was compiled with 'CGO_ENABLED=0', go-sqlite3 requires cgo to work.
解决：
编译时打开 CGO 开关：CGO_ENABLED=1
