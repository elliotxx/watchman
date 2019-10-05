## 简介
更夫（watchman）是一款可视化定时任务配置工具，集成有Web端交互界面、正则表达式解析、定时任务、邮件提醒、模板定制等功能。

简单来说，更夫是一个Web应用程序，集成有前后端和数据库，可通过 Docker 或者镜像仓库进行一键部署，它的原理是通过在前端配置的定时任务，定时去和数据库中存储的数据对比，如果不一样，代表有更新，发送邮件进行提示，然后更新数据库。

## 依赖
* 前端: React（AntDesign）
* 后端: Golang 1.12
* web 框架: Gin 1.4
* 数据库: Sqlite3

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

## 使用
### 使用 Dockerfile 构建镜像 & 运行容器
```
docker build -f Dockerfile -t watchman .
docker run -d -p 8007:80 watchman
```
浏览器访问 ```127.0.0.1:8007``` 查看效果

### 使用 Docker hub 拉取镜像 & 运行容器
使用官方 Docker hub 拉取镜像（可能有些慢）
```
docker pull elliotxx/watchman
docker run -d -p 8007:80 --name=watchman elliotxx/watchman
```

或者使用 阿里云容器镜像服务 拉取镜像（国内加速）

```
docker pull registry.cn-shanghai.aliyuncs.com/elliotxx/watchman
docker run -d -p 8007:80 --name=watchman registry.cn-shanghai.aliyuncs.com/elliotxx/watchman
```
浏览器访问 ```127.0.0.1:8007``` 查看效果

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
### docker 镜像加速
鉴于国内网络问题，后续拉取 Docker 镜像十分缓慢，我们可以需要配置加速器来解决，网易的镜像地址：http://hub-mirror.c.163.com。

配置以下文件，设置 docker 镜像仓库代理（如果没有该文件，就创建一个）：
```
# linux
vi /etc/docker/daemon.json
# windows
%programdata%\docker\config\daemon.json 或者 %USERPROFILE%\.docker\daemon.json
# mac
~/.docker/daemon.json
```

请在该配置文件中加入：
```
{
  "registry-mirrors": ["http://hub-mirror.c.163.com","https://registry.docker-cn.com"]
}
```

### windows docker 安装
windows docker 比较麻烦，有两种方式。一种是 docker toolbox，另一种是 docker for windows

推荐使用 docker toolbox，比较简单，国内可以使用阿里云的镜像来下载，下载地址：

http://mirrors.aliyun.com/docker-toolbox/windows/docker-toolbox/

装好之后，点击 "开始 => Docker Quickstart Terminal"，即可运行

注意：如果点击 Docker Quickstart Terminal 弹出“找不到 bash”，需要你手动指定 git bash 的安装位置，比如我的就是：“D:\Program Files\Git\bin\bash.exe”


### go-sqlite3 需要在编译时开启 cgo 才能工作
否则报错：Binary was compiled with 'CGO_ENABLED=0', go-sqlite3 requires cgo to work.
解决：
编译时打开 CGO 开关：CGO_ENABLED=1


### standard_init_linux.go:178: exec user process caused "no such file or directory"
golang docker build 制作完进项后运行报错

出现该问题的原因是编译的环境和运行的环境不同，可能有动态库的依赖

１．默认go使用静态链接，在docker的golang环境中默认是使用动态编译。

２．如果想使用docker编译+alpine部署，可以通过禁用cgoCGO_ENABLED=0来解决。

３．如果要使用cgo可以通过go build --ldflags "-extldflags -static" 来让gcc使用静态编译。

ref: https://www.cnblogs.com/davygeek/p/10969434.html


### 使用 docker toolbox 主机无法用localhost访问 只能通过默认的宿主ip
背景：在 Docker Quickstart Terminal 中运行 ```docker run -d -p 8080:8080 watchman-test:latest``` 启动一个容器的时候，我期望在浏览器中输入 ```127.0.0.1:8080``` 便可以看到容器中 webapp 的返回结果，但却访问不到该地址

原因：因为 docker toolbox 默认是跑在 virtualbox 中的，而 virtualbox 中做了端口转发的限制，所以默认情况下我设置的端口在外网都是访问不到的

解决：打开 virtualbox 会发现有个名叫 default 的虚拟机正在运行，docker toolbox 就跑在这上面，然后依次点击 "default 右键设置 => 网络 => 网卡1 => 高级 => 端口转发"，添加一条："Rule 1 | TCP | 127.0.0.1 | 8080 | | 8080"

再在浏览器中访问一下，是不是可以了呢

ref: https://blog.csdn.net/qq_36760953/article/details/83303322


### 同一个 docker 容器中，如何同时运行两个进程
背景：
在同一个容器中，同时部署了前后端程序，前端需要 nginx，后端程序也要运行，这就要求两个进程同时运行

但是我试过用 ```RUN xxx &``` 和 ```ENTRYPOINT ["nginx", "-g", "daemon off;"]``` 组合的方式，一个通过 RUN 运行，一个用 ENTRYPOINT 容器启动时运行，但是不知道为什么用 RUN 运行的程序没有启动起来。

所以只能想办法用 ENTRYPOINT 同时运行这两个程序

解决：
解决方法是把两个程序的启动命令都放到一个启动脚本里，然后再 ENTRYPOINT 中运行这个脚本，启动脚本最后跑一个死循环，这样可以保证容器一直运行。

注意这两个程序的输出都写入到日志文件当中，然后把日志文件所在目录通过 VOLUME 方式挂载出来，这样可以防止日志文件在容器中增量到过大。

run.sh 启动脚本样例：
```
#!/bin/bash
 
# run watchman
watchman > /data/watchman.log 2>&1 &
# run nginx
nginx -g 'daemon off;' > /data/nginx.log 2>&1 &
 
# just keep this script running
while [[ true ]]; do
    sleep 1
done
```


### 同一个 docker 容器中，前后端分离部署，跨域访问的解决方案
背景：
在同一个容器中，同时部署了前后端程序，前端通过 nginx 转发 80 端口进行访问，后端运行在 8080 端口。

前端中有 ajax 请求需要访问后端提供的接口，这个时候就会产生跨域请求问题，用户在浏览器访问前端然后请求 127.0.0.1:8080 显然是不合理的，除非再开启一个后端容器单独跑在 8080 端口，但是这样又背离了部署在同一个容器的初衷。

解决：
解决办法就是在后端接口加上 /api/v1/ 前缀，然后设置 nginx location 代理 /api/v1 到 8080 端口
```
location /api/v1 {
    proxy_pass   http://127.0.0.1:8080;
}
```
这样前后端请求都是通过 80 端口进入容器，只不过容器中的 nginx 转发了其中的 /api/v1 前缀的请求到后端 8080 端口


### 前端中使用 react-router-dom 在浏览器中直接输入 url 无法访问的问题
背景：
前端中使用 react-router-dom 做路由，但是同样的 url 在路由页点击可以正常切换，在浏览器中输入 url 就无法访问了

原因：
router 设置的路由链接不是真实的链接，需要通过访问路由页 js 才能做转发，直接访问 url 其实是不存在这个资源的

解决：
将 BrowserRouter 修改为 HashRouter 即可解决，即：
```
import {BrowserRouter as Router,Route,Link} from 'react-router-dom'
```
修改为：
```
import {HashRouter as Router,Route,Link} from 'react-router-dom';
```

HashRouter 会在 url 前加一个 #，其实就是通过标签的方式标记了对应 url

ref：https://segmentfault.com/q/1010000012959395


### nginx 启用 gzip 压缩 js 等文件
背景：
发现前端程序用 npm build 之后产生的 js 文件也有 400k，浏览器第一次访问需要 40s 才能加载出来

解决：
在 nginx 中启动 gzip 压缩 js 等文件，速度提升一半

ref：https://blog.csdn.net/kwy15732621629/article/details/78475021

## 参考资料
* 程序员笔记——如何编写优雅的Dockerfile  
https://studygolang.com/articles/20102

* Dockerfile语法  
https://blog.csdn.net/u013755520/article/details/91126933