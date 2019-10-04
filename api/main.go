package main

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"time"
	"watchman-api/api"
)

func main() {
	// 连接 sqlite3 数据库
	var err error
	api.DB, err = gorm.Open("sqlite3", "watchman.db")
	if err != nil {
		panic("failed to connect database")
	}
	defer api.DB.Close()
	// 自动迁移模式将保持更新到最新
	// 自动迁移仅仅会创建表，缺少列和索引，并且不会改变现有列的类型或删除未使用的列以保护数据
	api.DB.AutoMigrate(&api.Job{})

	// 创建 gin 实例
	r := gin.Default()

	// 添加 cros 中间件，允许跨域访问
	r.Use(cors.New(cors.Config{
		AllowOriginFunc:  func(origin string) bool { return true },
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// 添加接口路由及响应函数
	r.POST("/job", api.AddJob)
	r.DELETE("/job", api.DeleteJob)
	r.PUT("/job", api.UpdateJob)
	r.GET("/job", api.ListJob)

	// 让服务跑起来，默认监听 0.0.0.0:8080
	r.Run()
}
