## watchman 后端

## 依赖
* 后端: golang 1.12+
* web 框架: gin 1.4
* 数据库: sqlite3

使用 go modules 安装后端依赖
```
cd api
go mod tidy
```

## 使用
### 使用 docker 安装
使用 Docker 构建镜像 & 运行容器
```
cd api
docker build -f Dockerfile -t watchman-api .
docker run -d -p 8083:8080 watchman-api
```
浏览器访问 ```127.0.0.1:8083/job``` 查看效果

## 开启权限认证
部署成功后，默认没有开启权限认证，也就是说接口都可以公开访问。

如果要开启权限认证，请修改配置，采用 BasicAuth 进行认证。

配置修改位置在 ```api/config.go L24```：
```
var IsBasicAuth = false // 修改这里开启权限控制（调用接口需要输入用户名 & 密码）
var Secrets 	= map[string]string{    // 默认登录账户
	"admin": "12345",
}
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