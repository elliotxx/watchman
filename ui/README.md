## watchman 前端

## 技术栈
* 前端：React（AntDesign）

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