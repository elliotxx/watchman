## 简介
更夫（watchman）是一款可视化定时任务配置工具，集成有Web端交互界面、正则表达式解析、定时任务、邮件提醒、模板定制等功能。

简单来说，更夫是一个Web应用程序，集成有前后端和数据库，可通过 Docker 或者镜像仓库进行一键部署，它的原理是通过在前端配置的定时任务，定时去和数据库中存储的数据对比，如果不一样，代表有更新，发送邮件进行提示，然后更新数据库。

## 技术栈
* 前端：React（AntDesign）
* 后端：Go（Gin）
* 数据库：Sqlite3

## 功能
- [ ] 定时任务
    - [ ] 定时执行
    - [ ] 开始/暂停按钮
- [ ] 对比目标抓取方式
    - [ ] 正则表达式
    - [ ] lxml
- [ ] 邮件提醒
- [ ] 配置邮件账号和密码
- [ ] 抓取模板定制

## 数据表设计
定时任务
```
任务名称	string
定时配置	string
运行状态	int		# 0代表“运行中”、1代表“暂停”
```

## 笔记
### npm 替换成国内淘宝源
```
npm config set registry https://registry.npm.taobao.org
-- 配置后可通过下面方式来验证是否成功
npm config get registry
-- 或npm info express
```
或者直接安装 cnpm，通过 cnpm 安装包

官网：http://npm.taobao.org/
```
npm install -g cnpm --registry=https://registry.npm.taobao.org
```