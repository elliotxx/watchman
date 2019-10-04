## watchman 前端

## 技术栈
* 前端：React（AntDesign）

## 使用
### 使用 Docker 安装
使用 Docker 构建镜像 & 运行容器
```
cd ui
docker build -f Dockerfile -t watchman-ui .
docker run -d -p 8082:80 watchman-ui
```
浏览器访问 ```127.0.0.1:8082``` 查看效果

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